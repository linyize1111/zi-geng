import { getSupabaseClient } from "@/lib/supabase/client";
import type { CooldownContentType } from "@/features/study/normalize";
import { cooldownStepsFor } from "@/features/study/normalize";
import { qualityWeightedPick } from "@/features/study/quality-pick";

export type StudyContentType =
  "vocabulary" | "quote" | "craft" | "prompt" | "novel" | "knowledge" | "japanese";

export type StudyEventType =
  | "shown"
  | "refreshed"
  | "favorited"
  | "dismissed"
  | "completed"
  | "too_easy"
  | "not_useful"
  | "want_more"
  | "good";

export type StudyEventInput = {
  contentType: StudyContentType;
  contentId: string;
  normalizedKey?: string | null;
  eventType: StudyEventType;
  localDate?: string | null;
  meta?: Record<string, unknown>;
};

function localDateInTz(timeZone = "Asia/Taipei"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function recordStudyEvent(input: StudyEventInput): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return;

  const { error } = await client.from("zg_study_events").insert({
    user_id: user.id,
    content_type: input.contentType,
    content_id: input.contentId,
    normalized_key: input.normalizedKey ?? null,
    event_type: input.eventType,
    local_date: input.localDate ?? localDateInTz(),
    meta: input.meta ?? {},
  });
  if (error) {
    // Table may not exist until Owner applies Phase 1 SQL — fail soft.
    console.warn("recordStudyEvent", error.message);
  }
}

export async function recordStudyEvents(inputs: StudyEventInput[]): Promise<void> {
  if (!inputs.length) return;
  const client = getSupabaseClient();
  if (!client) return;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return;
  const localDate = localDateInTz();
  const rows = inputs.map((input) => ({
    user_id: user.id,
    content_type: input.contentType,
    content_id: input.contentId,
    normalized_key: input.normalizedKey ?? null,
    event_type: input.eventType,
    local_date: input.localDate ?? localDate,
    meta: input.meta ?? {},
  }));
  const { error } = await client.from("zg_study_events").insert(rows);
  if (error) console.warn("recordStudyEvents", error.message);
}

/** Prefer RPC; fall back to empty if SQL not applied yet. */
export async function fetchCooldownContentIds(
  contentType: CooldownContentType,
  days: number,
  timezone = "Asia/Taipei",
): Promise<Set<string>> {
  const client = getSupabaseClient();
  if (!client) return new Set();
  const { data, error } = await client.rpc("zg_cooldown_content_ids", {
    p_content_type: contentType,
    p_days: days,
    p_timezone: timezone,
  });
  if (error) {
    console.warn("zg_cooldown_content_ids", error.message);
    return new Set();
  }
  return new Set((data as string[] | null) ?? []);
}

export async function fetchTooEasyBlockedIds(
  contentType: CooldownContentType,
  timezone = "Asia/Taipei",
): Promise<Set<string>> {
  const client = getSupabaseClient();
  if (!client) return new Set();
  const { data, error } = await client.rpc("zg_blocked_too_easy_ids", {
    p_content_type: contentType,
    p_timezone: timezone,
  });
  if (error) {
    console.warn("zg_blocked_too_easy_ids", error.message);
    return new Set();
  }
  return new Set((data as string[] | null) ?? []);
}

/**
 * Pick ids avoiding cooldown with stepped fallback.
 * Always excludes `hardAvoid` (e.g. current plan ids — same-day no repeat).
 */
export async function pickIdsWithCooldown(options: {
  contentType: CooldownContentType;
  poolIds: string[];
  count: number;
  hardAvoid?: Set<string>;
  timezone?: string;
  /** Prefer higher quality_score among cooldown-eligible ids. */
  qualityById?: Map<string, number>;
}): Promise<string[]> {
  const {
    contentType,
    poolIds,
    count,
    hardAvoid = new Set(),
    timezone = "Asia/Taipei",
    qualityById,
  } = options;
  if (!poolIds.length || count <= 0) return [];

  const blocked = await fetchTooEasyBlockedIds(contentType, timezone);
  const steps = cooldownStepsFor(contentType);

  for (const days of steps) {
    const cool =
      days === 0 ? new Set<string>() : await fetchCooldownContentIds(contentType, days, timezone);
    const free = poolIds.filter((id) => !hardAvoid.has(id) && !blocked.has(id) && !cool.has(id));
    if (free.length >= count) return qualityWeightedPick(free, count, qualityById);
  }

  // Last resort: ignore cooldown but still honor too_easy + hardAvoid when possible
  const soft = poolIds.filter((id) => !hardAvoid.has(id) && !blocked.has(id));
  const base = soft.length ? soft : poolIds.filter((id) => !hardAvoid.has(id));
  return qualityWeightedPick(
    base.length ? base : poolIds,
    Math.min(count, poolIds.length),
    qualityById,
  );
}
