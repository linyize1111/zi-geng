import { getZiGengDb } from "@/lib/offline/db";
import type { NovelChapter, NovelCharacter, NovelScene } from "@/features/novels/types";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

async function nextSort(
  table: "novelCharacters" | "novelChapters" | "novelScenes",
  projectId: string,
): Promise<number> {
  const rows = await getZiGengDb()[table].where("projectId").equals(projectId).toArray();
  const live = rows.filter((r) => r.deletedAt == null);
  return live.length === 0 ? 0 : Math.max(...live.map((r) => r.sortOrder)) + 1;
}

export async function listCharacters(userId: string, projectId: string): Promise<NovelCharacter[]> {
  const rows = await getZiGengDb()
    .novelCharacters.where("projectId")
    .equals(projectId)
    .filter((r) => r.userId === userId && r.deletedAt == null)
    .toArray();
  return rows.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createCharacter(
  userId: string,
  projectId: string,
  input?: { name?: string; role?: string },
): Promise<NovelCharacter> {
  const createdAt = nowIso();
  const row: NovelCharacter = {
    id: newId(),
    userId,
    projectId,
    name: input?.name?.trim() || "未命名角色",
    role: input?.role?.trim() || "",
    notes: "",
    sortOrder: await nextSort("novelCharacters", projectId),
    deletedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
  await getZiGengDb().novelCharacters.put(row);
  return row;
}

export async function updateCharacter(
  userId: string,
  id: string,
  patch: Partial<Pick<NovelCharacter, "name" | "role" | "notes">>,
): Promise<NovelCharacter> {
  const existing = await getZiGengDb().novelCharacters.get(id);
  if (!existing || existing.userId !== userId || existing.deletedAt) {
    throw new Error("找不到角色");
  }
  const next: NovelCharacter = {
    ...existing,
    name: patch.name !== undefined ? patch.name.trim() || "未命名角色" : existing.name,
    role: patch.role ?? existing.role,
    notes: patch.notes ?? existing.notes,
    updatedAt: nowIso(),
  };
  await getZiGengDb().novelCharacters.put(next);
  return next;
}

export async function softDeleteCharacter(userId: string, id: string): Promise<void> {
  const existing = await getZiGengDb().novelCharacters.get(id);
  if (!existing || existing.userId !== userId || existing.deletedAt) return;
  await getZiGengDb().novelCharacters.put({
    ...existing,
    deletedAt: nowIso(),
    updatedAt: nowIso(),
  });
}

export async function listChapters(userId: string, projectId: string): Promise<NovelChapter[]> {
  const rows = await getZiGengDb()
    .novelChapters.where("projectId")
    .equals(projectId)
    .filter((r) => r.userId === userId && r.deletedAt == null)
    .toArray();
  return rows.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createChapter(
  userId: string,
  projectId: string,
  input?: { title?: string },
): Promise<NovelChapter> {
  const createdAt = nowIso();
  const row: NovelChapter = {
    id: newId(),
    userId,
    projectId,
    title: input?.title?.trim() || "未命名章節",
    synopsis: "",
    sortOrder: await nextSort("novelChapters", projectId),
    deletedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
  await getZiGengDb().novelChapters.put(row);
  return row;
}

export async function updateChapter(
  userId: string,
  id: string,
  patch: Partial<Pick<NovelChapter, "title" | "synopsis">>,
): Promise<NovelChapter> {
  const existing = await getZiGengDb().novelChapters.get(id);
  if (!existing || existing.userId !== userId || existing.deletedAt) {
    throw new Error("找不到章節");
  }
  const next: NovelChapter = {
    ...existing,
    title: patch.title !== undefined ? patch.title.trim() || "未命名章節" : existing.title,
    synopsis: patch.synopsis ?? existing.synopsis,
    updatedAt: nowIso(),
  };
  await getZiGengDb().novelChapters.put(next);
  return next;
}

export async function softDeleteChapter(userId: string, id: string): Promise<void> {
  const existing = await getZiGengDb().novelChapters.get(id);
  if (!existing || existing.userId !== userId || existing.deletedAt) return;
  await getZiGengDb().novelChapters.put({
    ...existing,
    deletedAt: nowIso(),
    updatedAt: nowIso(),
  });
}

export async function listScenes(userId: string, projectId: string): Promise<NovelScene[]> {
  const rows = await getZiGengDb()
    .novelScenes.where("projectId")
    .equals(projectId)
    .filter((r) => r.userId === userId && r.deletedAt == null)
    .toArray();
  return rows.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createScene(
  userId: string,
  projectId: string,
  input?: { title?: string; chapterId?: string | null },
): Promise<NovelScene> {
  const createdAt = nowIso();
  const row: NovelScene = {
    id: newId(),
    userId,
    projectId,
    chapterId: input?.chapterId ?? null,
    title: input?.title?.trim() || "未命名場景",
    goal: "",
    bodyMd: "",
    sortOrder: await nextSort("novelScenes", projectId),
    deletedAt: null,
    createdAt,
    updatedAt: createdAt,
  };
  await getZiGengDb().novelScenes.put(row);
  return row;
}

export async function updateScene(
  userId: string,
  id: string,
  patch: Partial<Pick<NovelScene, "title" | "goal" | "bodyMd" | "chapterId">>,
): Promise<NovelScene> {
  const existing = await getZiGengDb().novelScenes.get(id);
  if (!existing || existing.userId !== userId || existing.deletedAt) {
    throw new Error("找不到場景");
  }
  const next: NovelScene = {
    ...existing,
    title: patch.title !== undefined ? patch.title.trim() || "未命名場景" : existing.title,
    goal: patch.goal ?? existing.goal,
    bodyMd: patch.bodyMd ?? existing.bodyMd,
    chapterId: patch.chapterId !== undefined ? patch.chapterId : existing.chapterId,
    updatedAt: nowIso(),
  };
  await getZiGengDb().novelScenes.put(next);
  return next;
}

export async function softDeleteScene(userId: string, id: string): Promise<void> {
  const existing = await getZiGengDb().novelScenes.get(id);
  if (!existing || existing.userId !== userId || existing.deletedAt) return;
  await getZiGengDb().novelScenes.put({
    ...existing,
    deletedAt: nowIso(),
    updatedAt: nowIso(),
  });
}
