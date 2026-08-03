/** Prefer higher quality_score while keeping mild randomness. */

export function qualityWeightedPick(
  ids: string[],
  count: number,
  qualityById?: Map<string, number>,
): string[] {
  if (!ids.length || count <= 0) return [];
  const n = Math.min(count, ids.length);
  if (!qualityById || qualityById.size === 0) {
    return shuffle(ids).slice(0, n);
  }
  const scored = ids.map((id) => ({ id, q: qualityById.get(id) ?? 70 }));
  scored.sort((a, b) => b.q - a.q || Math.random() - 0.5);
  const window = Math.max(n * 3, Math.ceil(scored.length * 0.35));
  const pool = scored.slice(0, Math.min(window, scored.length));
  return shuffle(pool)
    .slice(0, n)
    .map((x) => x.id);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
