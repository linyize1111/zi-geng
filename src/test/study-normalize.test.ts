import { describe, expect, it } from "vitest";
import {
  cooldownStepsFor,
  normalizeCraftName,
  normalizeTerm,
  quoteNormalizedKey,
} from "@/features/study/normalize";

describe("study normalize", () => {
  it("normalizeTerm strips spaces and quotes", () => {
    expect(normalizeTerm(" 澄 澈 ")).toBe("澄澈");
    expect(normalizeTerm("「惶惑」")).toBe("惶惑");
    expect(normalizeTerm("ＡＢ")).toBe("ab");
  });

  it("normalizeCraftName mirrors term normalize", () => {
    expect(normalizeCraftName("白描　筆法")).toBe("白描筆法");
  });

  it("quoteNormalizedKey is stable for same quote", () => {
    const a = quoteNormalizedKey("我思故我在。");
    const b = quoteNormalizedKey("我思故我在。");
    const c = quoteNormalizedKey("上帝已死。");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a.startsWith("q:")).toBe(true);
  });

  it("cooldownStepsFor stays within primary days", () => {
    expect(cooldownStepsFor("vocabulary")).toEqual([7, 3, 0]);
    expect(cooldownStepsFor("quote")).toEqual([14, 7, 3, 0]);
    expect(cooldownStepsFor("knowledge")).toEqual([21, 14, 7, 3, 0]);
  });
});
