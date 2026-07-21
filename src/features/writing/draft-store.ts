import { getZiGengDb } from "@/lib/offline/db";
import type { CreateDraftInput, UpdateDraftInput, WritingDraft } from "@/features/writing/types";
import { countWords, toPlainText } from "@/features/writing/word-count";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
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
  const next: WritingDraft = {
    ...existing,
    title: patch.title !== undefined ? patch.title.trim() || "無標題" : existing.title,
    contentMd,
    contentPlain,
    category: patch.category ?? existing.category,
    tags: patch.tags ?? existing.tags,
    visibility: patch.visibility ?? existing.visibility,
    wordCount: countWords(contentPlain),
    revision: existing.revision + 1,
    syncStatus: "local-only",
    updatedAt: nowIso(),
  };
  await getZiGengDb().drafts.put(next);
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

/** Remove all private drafts for a user (logout cleanup). */
export async function clearUserDrafts(userId: string): Promise<number> {
  return getZiGengDb().drafts.where("userId").equals(userId).delete();
}
