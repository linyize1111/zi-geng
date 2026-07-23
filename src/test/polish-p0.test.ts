import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { recordAnswer, weekPracticeCount } from "@/features/japanese/progress-store";
import { buildDailyReminderIcs } from "@/features/settings/ics";
import {
  readLocalReminderTime,
  writeLocalReminderTime,
} from "@/features/settings/local-reminder";
import { createDraft, updateDraft, weekWordsWritten } from "@/features/writing/draft-store";
import { resetZiGengDb } from "@/lib/offline/db";

describe("weekPracticeCount", () => {
  const userId = "00000000-0000-4000-8000-000000000011";

  beforeEach(async () => {
    await resetZiGengDb();
  });

  afterEach(async () => {
    await resetZiGengDb();
  });

  it("counts answers this week, not lifetime seen", async () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 1);
    const since = weekStart.toISOString();

    await recordAnswer(userId, "a", true);
    await recordAnswer(userId, "a", false);
    await recordAnswer(userId, "i", true);

    expect(await weekPracticeCount(userId, since)).toBe(3);

    const farFuture = new Date(Date.now() + 86_400_000).toISOString();
    expect(await weekPracticeCount(userId, farFuture)).toBe(0);
  });
});

describe("weekWordsWritten", () => {
  const userId = "00000000-0000-4000-8000-000000000012";

  beforeEach(async () => {
    await resetZiGengDb();
  });

  afterEach(async () => {
    await resetZiGengDb();
  });

  it("sums positive word deltas from saves this week", async () => {
    const since = new Date(Date.now() - 3_600_000).toISOString();
    const draft = await createDraft({ userId, title: "a", contentMd: "一二三四" });
    expect(draft.wordCount).toBe(4);
    await updateDraft(userId, draft.id, { contentMd: "一二三四五六" });
    await updateDraft(userId, draft.id, { contentMd: "一二" }); // shrink: no negative event

    expect(await weekWordsWritten(userId, since)).toBe(4 + 2);
  });
});

describe("buildDailyReminderIcs", () => {
  it("includes Asia/Taipei VTIMEZONE and TZID DTSTART", () => {
    const ics = buildDailyReminderIcs({ timeHHMM: "09:30" });
    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics).toContain("TZID:Asia/Taipei");
    expect(ics).toContain("TZOFFSETTO:+0800");
    expect(ics).toMatch(/DTSTART;TZID=Asia\/Taipei:\d{8}T093000/);
    expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
  });
});

describe("local reminder", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads default and persists HH:MM", () => {
    expect(readLocalReminderTime()).toBe("09:00");
    writeLocalReminderTime("07:45");
    expect(readLocalReminderTime()).toBe("07:45");
  });
});
