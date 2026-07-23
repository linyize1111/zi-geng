import Dexie, { type EntityTable } from "dexie";
import type { AssessmentAttempt } from "@/features/assessment/types";
import type { JapanesePracticeEvent, JapaneseProgress } from "@/features/japanese/types";
import type {
  NovelChapter,
  NovelCharacter,
  NovelProject,
  NovelScene,
} from "@/features/novels/types";
import type { WritingDraft, WritingWordEvent } from "@/features/writing/types";

export type ZiGengDatabase = Dexie & {
  drafts: EntityTable<WritingDraft, "id">;
  novelProjects: EntityTable<NovelProject, "id">;
  novelCharacters: EntityTable<NovelCharacter, "id">;
  novelChapters: EntityTable<NovelChapter, "id">;
  novelScenes: EntityTable<NovelScene, "id">;
  japaneseProgress: EntityTable<JapaneseProgress, "id">;
  japanesePracticeEvents: EntityTable<JapanesePracticeEvent, "id">;
  writingWordEvents: EntityTable<WritingWordEvent, "id">;
  assessmentAttempts: EntityTable<AssessmentAttempt, "id">;
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
  db.version(3).stores({
    drafts: "id, userId, updatedAt, deletedAt, promptId",
    novelProjects: "id, userId, updatedAt, deletedAt",
    novelCharacters: "id, userId, projectId, sortOrder, deletedAt",
    novelChapters: "id, userId, projectId, sortOrder, deletedAt",
    novelScenes: "id, userId, projectId, chapterId, sortOrder, deletedAt",
    japaneseProgress: "id, userId, kanaId, lastPracticedAt",
  });
  db.version(4).stores({
    drafts: "id, userId, updatedAt, deletedAt, promptId",
    novelProjects: "id, userId, updatedAt, deletedAt",
    novelCharacters: "id, userId, projectId, sortOrder, deletedAt",
    novelChapters: "id, userId, projectId, sortOrder, deletedAt",
    novelScenes: "id, userId, projectId, chapterId, sortOrder, deletedAt",
    japaneseProgress: "id, userId, kanaId, lastPracticedAt",
    japanesePracticeEvents: "id, userId, practicedAt, [userId+practicedAt]",
    writingWordEvents: "id, userId, at, [userId+at]",
  });
  db.version(5).stores({
    drafts: "id, userId, updatedAt, deletedAt, promptId",
    novelProjects: "id, userId, updatedAt, deletedAt",
    novelCharacters: "id, userId, projectId, sortOrder, deletedAt",
    novelChapters: "id, userId, projectId, sortOrder, deletedAt",
    novelScenes: "id, userId, projectId, chapterId, sortOrder, deletedAt",
    japaneseProgress: "id, userId, kanaId, lastPracticedAt",
    japanesePracticeEvents: "id, userId, practicedAt, [userId+practicedAt]",
    writingWordEvents: "id, userId, at, [userId+at]",
    assessmentAttempts: "id, userId, completedAt, [userId+completedAt]",
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
