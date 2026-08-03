/** Normalize helpers for study cooldown keys (字耕 v2.4 §11). */

export function normalizeTerm(term: string): string {
  return String(term ?? "")
    .normalize("NFKC")
    .replace(/[\s\u3000]+/g, "")
    .replace(/[「」『』【】（）()《》〈〉""'']/g, "")
    .toLowerCase();
}

export function normalizeCraftName(name: string): string {
  return normalizeTerm(name);
}

/** Short stable key for quotes (not cryptographic). */
export function quoteNormalizedKey(displayQuote: string): string {
  const s = normalizeTerm(displayQuote).slice(0, 80);
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `q:${(h >>> 0).toString(16)}`;
}

export function knowledgeNormalizedKey(series: string, topicKey: string): string {
  return `${normalizeTerm(series)}:${normalizeTerm(topicKey)}`;
}

export const COOLDOWN_DAYS = {
  vocabulary: 7,
  quote: 14,
  craft: 14,
  knowledge: 21,
  prompt: 14,
  novel: 14,
  japanese: 3,
} as const;

export type CooldownContentType = keyof typeof COOLDOWN_DAYS;

/** Stepped fallback when pool is thin. */
export const COOLDOWN_FALLBACK_STEPS = [21, 14, 7, 3, 0] as const;

export function cooldownStepsFor(type: CooldownContentType): number[] {
  const primary = COOLDOWN_DAYS[type];
  return COOLDOWN_FALLBACK_STEPS.filter((d) => d <= primary || d === 0);
}
