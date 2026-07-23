import { getZiGengDb } from "@/lib/offline/db";
import type { JapanesePracticeEvent, JapaneseProgress } from "@/features/japanese/types";

function nowIso(): string {
  return new Date().toISOString();
}

function progressId(userId: string, kanaId: string): string {
  return `${userId}::${kanaId}`;
}

export async function listProgress(userId: string): Promise<JapaneseProgress[]> {
  return getZiGengDb().japaneseProgress.where("userId").equals(userId).toArray();
}

export async function getProgress(
  userId: string,
  kanaId: string,
): Promise<JapaneseProgress | undefined> {
  return getZiGengDb().japaneseProgress.get(progressId(userId, kanaId));
}

export async function recordAnswer(
  userId: string,
  kanaId: string,
  correct: boolean,
): Promise<JapaneseProgress> {
  const id = progressId(userId, kanaId);
  const practicedAt = nowIso();
  const existing = await getZiGengDb().japaneseProgress.get(id);
  const next: JapaneseProgress = {
    id,
    userId,
    kanaId,
    seen: (existing?.seen ?? 0) + 1,
    correct: (existing?.correct ?? 0) + (correct ? 1 : 0),
    streak: correct ? (existing?.streak ?? 0) + 1 : 0,
    lastPracticedAt: practicedAt,
  };
  const event: JapanesePracticeEvent = {
    id: crypto.randomUUID(),
    userId,
    kanaId,
    correct,
    practicedAt,
  };
  await getZiGengDb().transaction("rw", ["japaneseProgress", "japanesePracticeEvents"], async () => {
    await getZiGengDb().japaneseProgress.put(next);
    await getZiGengDb().japanesePracticeEvents.put(event);
  });
  return next;
}

/** Count practice answers that actually occurred on/after `sinceIso` (not lifetime seen). */
export async function weekPracticeCount(userId: string, sinceIso: string): Promise<number> {
  return getZiGengDb()
    .japanesePracticeEvents.where("[userId+practicedAt]")
    .between([userId, sinceIso], [userId, "\uffff"], true, true)
    .count();
}
