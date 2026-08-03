import { describe, expect, it } from "vitest";
import { qualityWeightedPick } from "@/features/study/quality-pick";
import {
  pickNextKana,
  wrongAnswerPriorityScore,
  buildFiveMinutePlan,
} from "@/features/japanese/five-minute";
import { kanaByScript } from "@/features/japanese/kana";

describe("qualityWeightedPick", () => {
  it("prefers higher quality ids", () => {
    const ids = ["a", "b", "c", "d"];
    const q = new Map([
      ["a", 40],
      ["b", 90],
      ["c", 85],
      ["d", 50],
    ]);
    const picks = Array.from({ length: 20 }, () => qualityWeightedPick(ids, 1, q)[0]);
    const high = picks.filter((id) => id === "b" || id === "c").length;
    expect(high).toBeGreaterThan(picks.length / 2);
  });
});

describe("japanese wrong-answer priority", () => {
  it("scores wrong answers higher than mastered", () => {
    const weak = wrongAnswerPriorityScore({ kanaId: "x", seen: 5, correct: 1 });
    const strong = wrongAnswerPriorityScore({ kanaId: "y", seen: 5, correct: 5 });
    expect(weak).toBeGreaterThan(strong);
  });

  it("pickNextKana prefers weak items", () => {
    const pool = kanaByScript("hiragana").slice(0, 10);
    const progress = pool.map((k, i) => ({
      kanaId: k.id,
      seen: 5,
      correct: i === 0 ? 0 : 5,
    }));
    const counts = new Map<string, number>();
    for (let i = 0; i < 40; i++) {
      const picked = pickNextKana(pool, progress, { preferWrong: true });
      counts.set(picked.id, (counts.get(picked.id) ?? 0) + 1);
    }
    const weakest = pool[0]!.id;
    expect(counts.get(weakest) ?? 0).toBeGreaterThan(2);
  });

  it("buildFiveMinutePlan returns bounded sets", () => {
    const plan = buildFiveMinutePlan({
      kanaPool: kanaByScript("hiragana").slice(0, 20),
      vocabPool: [
        { id: "1", word: "私", reading: "わたし", meaningZh: "我" },
        { id: "2", word: "本", reading: "ほん", meaningZh: "書" },
        { id: "3", word: "水", reading: "みず", meaningZh: "水" },
        { id: "4", word: "火", reading: "ひ", meaningZh: "火" },
      ],
      grammarPool: [
        {
          id: "g1",
          title: "です",
          pattern: "N です",
          meaningZh: "是",
          example: "学生です",
        },
      ],
      progress: [],
      dateKey: "2026-08-04",
    });
    expect(plan.kana.length).toBeLessThanOrEqual(5);
    expect(plan.vocab.length).toBe(3);
    expect(plan.grammar?.id).toBe("g1");
    expect(plan.quizSize).toBe(5);
  });
});
