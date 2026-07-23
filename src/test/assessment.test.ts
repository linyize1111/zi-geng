import { describe, expect, it } from "vitest";
import { ASSESSMENT_QUESTIONS } from "@/features/assessment/questions";
import { scoreAssessment } from "@/features/assessment/score";

describe("assessment", () => {
  it("has a substantial question bank", () => {
    expect(ASSESSMENT_QUESTIONS.length).toBeGreaterThanOrEqual(40);
  });

  it("scores all-correct as 100 with four bands", () => {
    const answers = Object.fromEntries(ASSESSMENT_QUESTIONS.map((q) => [q.id, q.answer]));
    const profile = scoreAssessment(answers);
    expect(profile.overallPercent).toBe(100);
    expect(profile.bands).toHaveLength(4);
    expect(profile.bands.every((b) => b.percent === 100)).toBe(true);
  });

  it("scores all-wrong near zero", () => {
    const answers = Object.fromEntries(
      ASSESSMENT_QUESTIONS.map((q) => [q.id, ((q.answer + 1) % 4) as 0 | 1 | 2 | 3]),
    );
    const profile = scoreAssessment(answers);
    expect(profile.overallPercent).toBe(0);
  });
});
