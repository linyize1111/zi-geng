import { getZiGengDb } from "@/lib/offline/db";
import type { CreateNovelInput, NovelProject, UpdateNovelInput } from "@/features/novels/types";

function nowIso(): string {
  return new Date().toISOString();
}

export async function listNovels(userId: string): Promise<NovelProject[]> {
  const rows = await getZiGengDb()
    .novelProjects.where("userId")
    .equals(userId)
    .filter((d) => d.deletedAt == null)
    .toArray();
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getNovel(userId: string, id: string): Promise<NovelProject | undefined> {
  const row = await getZiGengDb().novelProjects.get(id);
  if (!row || row.userId !== userId || row.deletedAt) return undefined;
  return row;
}

export async function createNovel(input: CreateNovelInput): Promise<NovelProject> {
  const createdAt = nowIso();
  const project: NovelProject = {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.title?.trim() || "未命名小說",
    premise: input.premise ?? "",
    notes: "",
    syncStatus: "local-only",
    deletedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
  await getZiGengDb().novelProjects.put(project);
  return project;
}

export async function updateNovel(
  userId: string,
  id: string,
  patch: UpdateNovelInput,
): Promise<NovelProject> {
  const existing = await getNovel(userId, id);
  if (!existing) throw new Error("找不到小說專案");
  const next: NovelProject = {
    ...existing,
    title: patch.title !== undefined ? patch.title.trim() || "未命名小說" : existing.title,
    premise: patch.premise ?? existing.premise,
    notes: patch.notes ?? existing.notes,
    syncStatus: "local-only",
    updatedAt: nowIso(),
  };
  await getZiGengDb().novelProjects.put(next);
  return next;
}

export async function softDeleteNovel(userId: string, id: string): Promise<void> {
  const existing = await getNovel(userId, id);
  if (!existing) return;
  await getZiGengDb().novelProjects.put({
    ...existing,
    deletedAt: nowIso(),
    updatedAt: nowIso(),
  });
}
