/**
 * Count words for mixed Chinese / Latin writing.
 * - CJK ideographs each count as one word
 * - Latin / numeric tokens count as words
 * - Punctuation and whitespace do not count
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const normalized = text.normalize("NFC");
  const cjkMatches = normalized.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g);
  const cjkCount = cjkMatches?.join("").length ?? 0;

  const withoutCjk = normalized.replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g, " ");
  const latinTokens = withoutCjk
    .replace(/[^\p{L}\p{N}'’]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return cjkCount + latinTokens.length;
}

/** Lightweight plain-text cache from Markdown (enough for search / word count). */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
