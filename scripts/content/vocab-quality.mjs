/**
 * Shared vocab quality gate: writing craft + 國學 literacy.
 * Reject 半日-level basics and 蒙衝-type specialist junk.
 */
export const BASIC_TERMS = new Set(
  `
半日 整日 全日 半載 半世 半途 半天 一日 兩日 三日 五日 十日 一月 一年 一時 一刻
比較 因為 所以 但是 然後 可以 什麼 怎麼 為什麼 已經 還是 或者 如果 雖然 不過
東西 事情 地方 時候 樣子 問題 辦法 意思 感覺 想法 朋友 老師 學生 孩子 大人
漂亮 高興 快樂 傷心 生氣 害怕 喜歡 討厭 好看 好聽 好吃
上課 下課 上班 下班 吃飯 睡覺 走路 跑步 說話 看書 寫字
肥皂 教授 縣令 大將 官廳 團扇 織女 盯 挪 蹭 幾乎 竟然
`
    .split(/\s+/)
    .filter(Boolean),
);

export const BASIC_TERM_RE =
  /^[一二三四五六七八九十半整全上下前後左右]+[日天年月日歲時分秒]$|^第[一二三四五六七八九十百]+/;

export const JUNK_TERM_RE = /蒙衝|艨艟|斗艦|鬥艦|肥皂|縣令|令正|未入流|方士/;

export const JUNK_DEF_RE =
  /戰船|蒙衝|鬥艦|艨艟|兵器名|武器名|古兵器|鳥名|蟲名|魚名|獸名|草名|藥名|花名|樹名|礦物|化學|元素|化合物|縣名|地名|山名|水名|星名|宿名|卦名|貨幣名|度量衡|單位名|姓。$|二一四部首|阿拉伯數字|清潔用品|洗滌|職官名。?古代|明清稱凡未入|肥皂莢/;

export const LITERARY_HINT_RE =
  /文言|書面|文語|比喻|修辭|文學|典雅|婉辭|敬辭|謙辭|舊時|典故|語本|語出|《詩|《書|《易|《禮|《春|《論|《孟|《莊|《史|《漢|唐．|宋．|元．|明．|清．|心情|神色|態度|猶豫|徘徊|感嘆/;

/**
 * @param {string} term
 * @param {string} [def]
 * @returns {boolean} true = keep
 */
export function passesWritingLiteracyGate(term, def = "") {
  const t = String(term ?? "").trim();
  const d = String(def ?? "");
  if (!t || t.length > 12) return false;
  if (BASIC_TERMS.has(t) || BASIC_TERM_RE.test(t)) return false;
  if (JUNK_TERM_RE.test(t)) return false;
  if (d && JUNK_DEF_RE.test(d)) return false;
  // Prefer Han literary surface
  if (!/[\u4e00-\u9fff]/.test(t)) return false;
  // Single Latin/digit heavy titles
  if (/[A-Za-z0-9]{3,}/.test(t)) return false;
  return true;
}

/**
 * Soft score for ranking (higher = better for this product).
 * @param {string} term
 * @param {string} def
 */
export function writingLiteracyScore(term, def = "") {
  if (!passesWritingLiteracyGate(term, def)) return -999;
  let s = 10;
  if (LITERARY_HINT_RE.test(def)) s += 20;
  if (/語本|語出|典出/.test(def)) s += 12;
  if (term.length >= 2 && term.length <= 4) s += 6;
  if (term.length === 1) s -= 5;
  if (/職官|官名/.test(def)) s -= 25;
  return s;
}

/**
 * @template {{term?: string, short_def?: string, long_def?: string}} T
 * @param {T[]} cards
 */
export function filterVocabCards(cards) {
  const seen = new Set();
  const out = [];
  for (const c of cards) {
    const term = String(c.term ?? "").trim();
    const def = `${c.short_def ?? ""} ${c.long_def ?? ""}`;
    if (!passesWritingLiteracyGate(term, def)) continue;
    if (seen.has(term)) continue;
    seen.add(term);
    out.push(c);
  }
  return out;
}
