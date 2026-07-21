import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import {
  clearUserDrafts,
  createDraft,
  getDraft,
  listDrafts,
  softDeleteDraft,
  updateDraft,
} from "@/features/writing/draft-store";
import { countWords, toPlainText } from "@/features/writing/word-count";
import { resetZiGengDb } from "@/lib/offline/db";

describe("countWords", () => {
  it("counts CJK characters and Latin tokens", () => {
    expect(countWords("你好世界")).toBe(4);
    expect(countWords("hello world")).toBe(2);
    expect(countWords("寫作 hello")).toBe(3);
  });

  it("ignores punctuation", () => {
    expect(countWords("你好，世界！")).toBe(4);
    expect(countWords("Hello, world!")).toBe(2);
  });

  it("returns 0 for empty", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ,,,")).toBe(0);
  });
});

describe("toPlainText", () => {
  it("strips simple markdown", () => {
    expect(toPlainText("# 標題\n\n**粗體**")).toContain("標題");
    expect(toPlainText("# 標題\n\n**粗體**")).not.toContain("#");
  });
});

describe("draft-store", () => {
  const userId = "00000000-0000-4000-8000-000000000099";

  beforeEach(async () => {
    await resetZiGengDb();
  });

  afterEach(async () => {
    await resetZiGengDb();
  });

  it("creates and lists drafts for a user", async () => {
    const draft = await createDraft({
      userId,
      title: "晨間短寫",
      promptId: "prompt-1",
      promptTitle: "今日題",
    });
    expect(draft.syncStatus).toBe("local-only");
    expect(draft.revision).toBe(1);

    const listed = await listDrafts(userId);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.title).toBe("晨間短寫");
  });

  it("autosave-style update bumps revision and stays local-only", async () => {
    const draft = await createDraft({ userId, title: "草稿" });
    const updated = await updateDraft(userId, draft.id, {
      title: "更新標題",
      contentMd: "一段中文內容",
    });
    expect(updated.revision).toBe(2);
    expect(updated.syncStatus).toBe("local-only");
    expect(updated.wordCount).toBe(6);
    expect(updated.contentPlain).toContain("一段中文內容");
  });

  it("soft-deletes and clears on logout helper", async () => {
    const draft = await createDraft({ userId, title: "將刪除" });
    await softDeleteDraft(userId, draft.id);
    expect(await getDraft(userId, draft.id)).toBeUndefined();
    expect(await listDrafts(userId)).toHaveLength(0);

    await createDraft({ userId, title: "仍在" });
    const removed = await clearUserDrafts(userId);
    expect(removed).toBeGreaterThan(0);
    expect(await listDrafts(userId)).toHaveLength(0);
  });
});
