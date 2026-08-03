/**
 * Wrong-answer priority + 「今日 5 分鐘」plan builder.
 */

import type { JapaneseProgress } from "@/features/japanese/types";
import type { KanaEntry } from "@/features/japanese/kana";

export type ProgressLike = Pick<JapaneseProgress, "kanaId" | "seen" | "correct">;

/** Higher score = should appear sooner (more wrong / less seen). */
export function wrongAnswerPriorityScore(p: ProgressLike | undefined): number {
  if (!p || p.seen === 0) return 50;
  const wrong = p.seen - p.correct;
  const rate = p.correct / p.seen;
  return wrong * 40 + (1 - rate) * 60 + Math.max(0, 5 - p.seen) * 5;
}

/**
 * Prefer recently wrong / low-accuracy kana; fall back to random among pool.
 */
export function pickNextKana(
  pool: KanaEntry[],
  progress: ProgressLike[],
  opts?: { avoidId?: string; preferWrong?: boolean },
): KanaEntry {
  if (!pool.length) throw new Error("empty kana pool");
  const preferWrong = opts?.preferWrong ?? true;
  const byId = new Map(progress.map((p) => [p.kanaId, p]));
  const candidates = pool.filter((k) => k.id !== opts?.avoidId);
  const list = candidates.length ? candidates : pool;

  if (!preferWrong) {
    return list[Math.floor(Math.random() * list.length)]!;
  }

  const scored = list.map((k) => ({
    k,
    score: wrongAnswerPriorityScore(byId.get(k.id)),
  }));
  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);
  const top = scored.slice(0, Math.max(3, Math.ceil(scored.length / 3)));
  return top[Math.floor(Math.random() * top.length)]!.k;
}

function dateSeed(dateKey: string): number {
  return [...dateKey].reduce((a, c) => a + c.charCodeAt(0), 0);
}

export function buildFiveMinutePlan(opts: {
  kanaPool: KanaEntry[];
  vocabPool: Array<{ id: string; word: string; reading: string; meaningZh: string }>;
  grammarPool: Array<{
    id: string;
    title: string;
    pattern: string;
    meaningZh: string;
    example: string;
    exampleZh?: string;
  }>;
  progress: ProgressLike[];
  dateKey: string;
}): {
  kana: KanaEntry[];
  vocab: typeof opts.vocabPool;
  grammar: (typeof opts.grammarPool)[number] | null;
  quizSize: number;
} {
  const seed = dateSeed(opts.dateKey);
  const kana: KanaEntry[] = [];
  const avoid = new Set<string>();
  for (let i = 0; i < 5 && opts.kanaPool.length; i++) {
    const remaining = opts.kanaPool.filter((k) => !avoid.has(k.id));
    if (!remaining.length) break;
    const picked = pickNextKana(remaining, opts.progress);
    kana.push(picked);
    avoid.add(picked.id);
  }

  const vocabPicked: typeof opts.vocabPool = [];
  if (opts.vocabPool.length) {
    const vStart = seed % opts.vocabPool.length;
    for (let i = 0; i < 3; i++) {
      vocabPicked.push(opts.vocabPool[(vStart + i) % opts.vocabPool.length]!);
    }
  }

  const grammar = opts.grammarPool.length
    ? opts.grammarPool[seed % opts.grammarPool.length]!
    : null;

  return { kana, vocab: vocabPicked, grammar, quizSize: 5 };
}
