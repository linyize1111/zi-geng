import { getZiGengDb } from "@/lib/offline/db";
import {
  emptyCreativePlan,
  type CreateNovelInput,
  type NovelCreativePlan,
  type NovelProject,
  type UpdateNovelInput,
} from "@/features/novels/types";

function nowIso(): string {
  return new Date().toISOString();
}

function normalizePlan(raw: unknown): NovelCreativePlan {
  const base = emptyCreativePlan();
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Partial<NovelCreativePlan>;
  return {
    ...base,
    ...p,
    outlineStatus: p.outlineStatus ?? (p.outlineDraft?.trim() ? "draft" : "reserved"),
    currentPhase: p.currentPhase ?? "concept",
  };
}

function normalizeProject(row: NovelProject): NovelProject {
  return {
    ...row,
    plan: normalizePlan(row.plan),
  };
}

export async function listNovels(userId: string): Promise<NovelProject[]> {
  const rows = await getZiGengDb()
    .novelProjects.where("userId")
    .equals(userId)
    .filter((d) => d.deletedAt == null)
    .toArray();
  return rows.map(normalizeProject).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getNovel(userId: string, id: string): Promise<NovelProject | undefined> {
  const row = await getZiGengDb().novelProjects.get(id);
  if (!row || row.userId !== userId || row.deletedAt) return undefined;
  return normalizeProject(row as NovelProject);
}

export async function createNovel(input: CreateNovelInput): Promise<NovelProject> {
  const createdAt = nowIso();
  const project: NovelProject = {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.title?.trim() || "未命名小說",
    premise: input.premise ?? "",
    notes: "",
    plan: emptyCreativePlan(),
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
  const nextPlan = patch.plan ? normalizePlan({ ...existing.plan, ...patch.plan }) : existing.plan;
  if (patch.plan?.outlineDraft !== undefined) {
    const has = nextPlan.outlineDraft.trim().length > 0;
    if (nextPlan.outlineStatus === "reserved" && has) nextPlan.outlineStatus = "draft";
    if (!has && nextPlan.outlineStatus !== "locked") nextPlan.outlineStatus = "reserved";
  }
  const next: NovelProject = {
    ...existing,
    title: patch.title !== undefined ? patch.title.trim() || "未命名小說" : existing.title,
    premise: patch.premise ?? existing.premise,
    notes: patch.notes ?? existing.notes,
    plan: nextPlan,
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

export async function exportNovelsJson(userId: string): Promise<string> {
  const rows = await listNovels(userId);
  return JSON.stringify(
    {
      version: 1,
      exportedAt: nowIso(),
      projects: rows,
    },
    null,
    2,
  );
}

export async function importNovelsJson(userId: string, raw: string): Promise<number> {
  const parsed = JSON.parse(raw) as { projects?: NovelProject[] };
  const projects = parsed.projects ?? [];
  if (!Array.isArray(projects)) throw new Error("備份格式不正確");
  let n = 0;
  for (const p of projects) {
    if (!p || typeof p !== "object" || !p.title) continue;
    const id = typeof p.id === "string" && p.id ? p.id : crypto.randomUUID();
    const row: NovelProject = normalizeProject({
      ...p,
      id,
      userId,
      deletedAt: null,
      syncStatus: "local-only",
      updatedAt: nowIso(),
      createdAt: p.createdAt || nowIso(),
      plan: p.plan,
      premise: p.premise ?? "",
      notes: p.notes ?? "",
      title: p.title,
    } as NovelProject);
    await getZiGengDb().novelProjects.put(row);
    n += 1;
  }
  return n;
}
