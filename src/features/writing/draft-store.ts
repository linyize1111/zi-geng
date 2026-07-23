import { getZiGengDb } from "@/lib/offline/db";
import type {
  CreateDraftInput,
  UpdateDraftInput,
  WritingDraft,
  WritingWordEvent,
} from "@/features/writing/types";
import { countWords, toPlainText } from "@/features/writing/word-count";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

async function recordWordDelta(
  userId: string,
  draftId: string,
  deltaWords: number,
  at: string,
): Promise<void> {
  if (deltaWords <= 0) return;
  const event: WritingWordEvent = {
    id: newId(),
    userId,
    draftId,
    deltaWords,
    at,
  };
  await getZiGengDb().writingWordEvents.put(event);
}

export async function listDrafts(userId: string): Promise<WritingDraft[]> {
  const rows = await getZiGengDb()
    .drafts.where("userId")
    .equals(userId)
    .filter((d) => d.deletedAt == null)
    .toArray();
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDraft(userId: string, id: string): Promise<WritingDraft | undefined> {
  const draft = await getZiGengDb().drafts.get(id);
  if (!draft || draft.userId !== userId || draft.deletedAt) return undefined;
  return draft;
}

export async function createDraft(input: CreateDraftInput): Promise<WritingDraft> {
  const createdAt = nowIso();
  const contentMd = input.contentMd ?? "";
  const contentPlain = toPlainText(contentMd);
  const draft: WritingDraft = {
    id: newId(),
    userId: input.userId,
    promptId: input.promptId ?? null,
    promptTitle: input.promptTitle ?? null,
    title: input.title?.trim() || "無標題",
    contentMd,
    contentPlain,
    category: input.category ?? "",
    tags: input.tags ?? [],
    visibility: "private",
    wordCount: countWords(contentPlain),
    revision: 1,
    syncStatus: "local-only",
    publishedArticleId: null,
    deletedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
  await getZiGengDb().drafts.put(draft);
  if (draft.wordCount > 0) {
    await recordWordDelta(input.userId, draft.id, draft.wordCount, createdAt);
  }
  return draft;
}

export async function updateDraft(
  userId: string,
  id: string,
  patch: UpdateDraftInput,
): Promise<WritingDraft> {
  const existing = await getDraft(userId, id);
  if (!existing) throw new Error("找不到草稿");

  const contentMd = patch.contentMd ?? existing.contentMd;
  const contentPlain = toPlainText(contentMd);
  const wordCount = countWords(contentPlain);
  const updatedAt = nowIso();
  const next: WritingDraft = {
    ...existing,
    title: patch.title !== undefined ? patch.title.trim() || "無標題" : existing.title,
    contentMd,
    contentPlain,
    category: patch.category ?? existing.category,
    tags: patch.tags ?? existing.tags,
    visibility: patch.visibility ?? existing.visibility,
    wordCount,
    revision: existing.revision + 1,
    syncStatus: "local-only",
    updatedAt,
  };
  await getZiGengDb().drafts.put(next);
  await recordWordDelta(userId, id, wordCount - existing.wordCount, updatedAt);
  return next;
}

export async function softDeleteDraft(userId: string, id: string): Promise<void> {
  const existing = await getDraft(userId, id);
  if (!existing) return;
  await getZiGengDb().drafts.put({
    ...existing,
    deletedAt: nowIso(),
    updatedAt: nowIso(),
    syncStatus: "local-only",
  });
}

export async function listDeletedDrafts(userId: string): Promise<WritingDraft[]> {
  const rows = await getZiGengDb()
    .drafts.where("userId")
    .equals(userId)
    .filter((d) => d.deletedAt != null)
    .toArray();
  return rows.sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
}

export async function restoreDraft(userId: string, id: string): Promise<WritingDraft | undefined> {
  const draft = await getZiGengDb().drafts.get(id);
  if (!draft || draft.userId !== userId || !draft.deletedAt) return undefined;
  const next: WritingDraft = {
    ...draft,
    deletedAt: null,
    updatedAt: nowIso(),
    syncStatus: "local-only",
  };
  await getZiGengDb().drafts.put(next);
  return next;
}

export async function purgeDraft(userId: string, id: string): Promise<void> {
  const draft = await getZiGengDb().drafts.get(id);
  if (!draft || draft.userId !== userId) return;
  await getZiGengDb().drafts.delete(id);
}

export function draftToMarkdown(draft: WritingDraft): string {
  const header = [`# ${draft.title}`, ""];
  if (draft.promptTitle) header.push(`> 題目：${draft.promptTitle}`, "");
  return `${header.join("\n")}${draft.contentMd}\n`;
}

export function downloadDraftMarkdown(draft: WritingDraft): void {
  const blob = new Blob([draftToMarkdown(draft)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${draft.title.replace(/[\\/:*?"<>|]+/g, "_") || "draft"}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Words added in saves on/after `sinceIso` (positive deltas only).
 * Limitation: only events recorded after Dexie v4; pre-existing draft totals are not backfilled.
 */
export async function weekWordsWritten(userId: string, sinceIso: string): Promise<number> {
  const events = await getZiGengDb()
    .writingWordEvents.where("[userId+at]")
    .between([userId, sinceIso], [userId, "\uffff"], true, true)
    .toArray();
  return events.reduce((sum, e) => sum + e.deltaWords, 0);
}

/** Remove all private drafts for a user (logout cleanup). */
export async function clearUserDrafts(userId: string): Promise<number> {
  const db = getZiGengDb();
  const [removed] = await Promise.all([
    db.drafts.where("userId").equals(userId).delete(),
    db.writingWordEvents.where("userId").equals(userId).delete(),
  ]);
  return removed;
}
