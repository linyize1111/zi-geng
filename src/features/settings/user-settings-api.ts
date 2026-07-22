import { getSupabaseClient } from "@/lib/supabase/client";

export type UserSettings = {
  user_id: string;
  daily_mode: "light" | "standard" | "deep";
  daily_vocab_count: number;
  japanese_enabled: boolean;
  reminder_time: string | null;
};

type DbRow = {
  user_id: string;
  daily_mode: UserSettings["daily_mode"];
  daily_vocab_count: number;
  japanese_enabled: boolean;
  reminder_time: string | null;
};

function normalize(row: DbRow | null, userId: string): UserSettings {
  return {
    user_id: row?.user_id ?? userId,
    daily_mode: row?.daily_mode ?? "standard",
    daily_vocab_count: row?.daily_vocab_count ?? 7,
    japanese_enabled: row?.japanese_enabled ?? true,
    reminder_time: row?.reminder_time ?? null,
  };
}

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_user_settings")
    .select("user_id, daily_mode, daily_vocab_count, japanese_enabled, reminder_time")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return normalize(data as DbRow, userId);
}

export async function upsertUserSettings(
  userId: string,
  patch: Partial<
    Pick<UserSettings, "daily_mode" | "daily_vocab_count" | "japanese_enabled" | "reminder_time">
  >,
): Promise<UserSettings> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");

  const existing = await fetchUserSettings(userId);
  const next = {
    user_id: userId,
    daily_mode: patch.daily_mode ?? existing?.daily_mode ?? "standard",
    daily_vocab_count: patch.daily_vocab_count ?? existing?.daily_vocab_count ?? 7,
    japanese_enabled: patch.japanese_enabled ?? existing?.japanese_enabled ?? true,
    reminder_time:
      patch.reminder_time !== undefined ? patch.reminder_time : (existing?.reminder_time ?? null),
  };

  const { data, error } = await client
    .from("zg_user_settings")
    .upsert(next, { onConflict: "user_id" })
    .select("user_id, daily_mode, daily_vocab_count, japanese_enabled, reminder_time")
    .single();
  if (error) throw error;
  return normalize(data as DbRow, userId);
}
