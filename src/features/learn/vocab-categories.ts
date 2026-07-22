/** Learn vocab filter chips — keep in sync with scripts/content/vocab-classify.mjs */
export const VOCAB_FILTER_ORDER = [
  "主題",
  "情緒",
  "人物描寫",
  "動作描寫",
  "感官",
  "景物氣氛",
  "對話口吻",
  "時間節奏",
  "質感物件",
  "性格人際",
  "文筆修辭",
  "國學典故",
  "成語",
  "書面精選",
] as const;

export function vocabTopCategory(category: string | null | undefined): string {
  if (!category) return "書面精選";
  return category.split("・")[0]?.trim() || "書面精選";
}
