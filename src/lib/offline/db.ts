import Dexie, { type EntityTable } from "dexie";
import type { NovelProject } from "@/features/novels/types";
import type { WritingDraft } from "@/features/writing/types";

export type ZiGengDatabase = Dexie & {
  drafts: EntityTable<WritingDraft, "id">;
  novelProjects: EntityTable<NovelProject, "id">;
};

let db: ZiGengDatabase | null = null;

export function getZiGengDb(): ZiGengDatabase {
  if (db) return db;
  db = new Dexie("zi-geng") as ZiGengDatabase;
  db.version(1).stores({
    drafts: "id, userId, updatedAt, deletedAt, promptId",
  });
  db.version(2).stores({
    drafts: "id, userId, updatedAt, deletedAt, promptId",
    novelProjects: "id, userId, updatedAt, deletedAt",
  });
  return db;
}

/** Test-only: close and drop the singleton so suites stay isolated. */
export async function resetZiGengDb(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
  await Dexie.delete("zi-geng");
}
