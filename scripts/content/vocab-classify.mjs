/**
 * Writing-oriented vocab category taxonomy + classifier.
 * Top-level chips in Learn UI should map to these families.
 */

/** Preferred filter order for Learn UI. */
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
];

/** Normalize legacy / fragmented category strings → canonical `大類・小類`. */
export function normalizeCategory(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "書面精選・未分類";

  const mapTop = {
    情緒: "情緒",
    情緒詞彙: "情緒",
    情感詞彙: "情緒",
    動詞: "動作描寫",
    動作描寫: "動作描寫",
    敘事動詞: "動作描寫",
    感官: "感官",
    感覺: "感官",
    感覺描寫: "感官",
    人物描寫: "人物描寫",
    人物: "人物描寫",
    形貌描寫: "人物描寫",
    性格: "性格人際",
    性格人際: "性格人際",
    景物描寫: "景物氣氛",
    氣氛: "景物氣氛",
    氣氛描寫: "景物氣氛",
    景物氣氛: "景物氣氛",
    時間: "時間節奏",
    節奏: "時間節奏",
    時間節奏: "時間節奏",
    副詞: "對話口吻",
    對話口吻: "對話口吻",
    主題: "主題",
    質感: "質感物件",
    質感物件: "質感物件",
    文筆: "文筆修辭",
    修辭: "文筆修辭",
    風格評價: "文筆修辭",
    文筆修辭: "文筆修辭",
    國學: "國學典故",
    國學典故: "國學典故",
    文言詞彙: "書面精選",
    文言單字: "書面精選",
    成語: "成語",
    書面語詞: "書面精選",
    簡編: "書面精選",
    關係: "性格人際",
  };

  if (s.includes("・")) {
    const [top, ...rest] = s.split("・");
    const mapped = mapTop[top] ?? top;
    const sub = rest.join("・") || "通用";
    // collapse already-canonical tops that used wrong names
    if (mapped === "人物描寫" && (top === "性格" || top === "形貌描寫")) {
      return `人物描寫・${sub}`;
    }
    return `${mapped}・${sub}`;
  }

  const mapped = mapTop[s] ?? null;
  if (mapped) return `${mapped}・通用`;
  if (/簡編|書面|國語辭典|精選/.test(s)) return "書面精選・辭書";
  return s.includes("・") ? s : `書面精選・${s}`;
}

/**
 * Infer writing category from term + definition when dump categories are weak.
 */
export function classifyVocab(term, def, existingCategory) {
  const t = String(term ?? "");
  const d = String(def ?? "");
  const text = `${t} ${d}`;
  const existing = String(existingCategory ?? "");

  // Keep strong curated categories (themed / writer) after normalize
  if (
    existing &&
    !/^(書面語詞|簡編|國語辭典精選|書面精選)/.test(existing) &&
    !/^簡編[・・]/.test(existing)
  ) {
    const n = normalizeCategory(existing);
    // Curated tops — keep. Bulk「國學典故・精選/辭書」from old dumps → fall through.
    if (!n.startsWith("書面精選") && !(n.startsWith("國學典故") && /精選|辭書|單字|通用/.test(n))) {
      return n;
    }
  }

  if (/成語|四字格|四字詞/.test(d) && t.length >= 3 && t.length <= 8) {
    return "成語・辭書";
  }
  // Do NOT auto-label 國學 from MOE glosses — nearly all cite 語本《…》.
  // Curated themed/writer categories already carry 國學典故・…
  if (
    /怒|憤|怨|哀|悲|懼|恐|喜|樂|羞|愧|鬱|悵|惘|悸|慌|慍|恚|惻隱|悱惻|繾綣|悻|愀|泫|悵惘/.test(text)
  ) {
    return "情緒・辭書";
  }
  if (
    /性情|為人|品性|性格|氣度|風度|容貌|神態|相貌|儀表|風采|人品|卓異|豪邁|灑脫|正直|蠻橫|溫婉|端莊|清癯|憔悴|嶙峋|頹唐|倨傲|謙卑|形容詞.*人|指人的|形容人|眉|眸|唇|臉色|面色|氣色|淚光/.test(
      text,
    )
  ) {
    if (/眉|眸|唇|臉|面色|氣色|淚|顴|頰|額/.test(text)) {
      return "人物描寫・面貌";
    }
    return "人物描寫・辭書";
  }
  if (
    /斜視|輕撫|緊握|徘徊|步履|舉手|揮手|點頭|搖頭|嘆氣|低語|逡巡|踟躕|踉蹌|徜徉|彷徨|睥睨|戟指/.test(
      text,
    )
  ) {
    return "動作描寫・辭書";
  }
  if (/風景|景物|山水|寂靜|冷清|蕭索|夜色|雲煙|雨絲|街景|氣氛沉|闃寂|肅殺|旖旎|縹緲/.test(text)) {
    return "景物氣氛・辭書";
  }
  if (/光影|斑駁|清澈|刺鼻|氣味|聲響|觸感|冰冷|灼熱|昏黃|炫目|熹微|窸窣/.test(text)) {
    return "感官・辭書";
  }
  if (/布料|絲織|質地|衣料|材質|錦緞|緙絲/.test(text)) {
    return "質感物件・辭書";
  }
  if (/修辭手法|筆法|文筆|白描|留白|用典|對仗|煉字|含蓄|隱晦|綿密|跌宕/.test(text)) {
    return "文筆修辭・辭書";
  }
  if (/片刻|良久|須臾|倏忽|頃刻/.test(text)) {
    return "時間節奏・辭書";
  }

  if (existing) {
    const n = normalizeCategory(existing);
    // Collapse over-broad 國學 from older dumps into 書面精選 unless curated sub-label.
    if (n.startsWith("國學典故") && /辭書|精選|單字|通用/.test(n)) {
      return "書面精選・辭書";
    }
    return n;
  }
  return "書面精選・辭書";
}

export function topCategory(category) {
  return String(category ?? "")
    .split("・")[0]
    .trim();
}
