/**
 * Harvest writing-theme vocab from local MOE dumps (CC BY-ND 3.0 TW).
 * No network required — mines dict_revised.json + dict_concised.json.
 *
 * Themes: 情緒 / 人物描寫・面貌 / 人物描寫 / 動作描寫 / 感官 / 景物氣氛 / …
 *
 *   node scripts/content/harvest-moe-themes.mjs
 *   node scripts/content/harvest-moe-themes.mjs --per-theme=180
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyVocab } from "./vocab-classify.mjs";
import {
  passesWritingLiteracyGate,
  writingLiteracyScore,
} from "./vocab-quality.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const perTheme = (() => {
  const hit = process.argv.find((a) => a.startsWith("--per-theme="));
  return hit ? Number(hit.split("=")[1]) : 320;
})();

/** @type {{ id: string; category: string; re: RegExp; boost?: RegExp }[]} */
const THEMES = [
  {
    id: "emotion",
    category: "情緒・辭書精選",
    re: /怒|憤|怨|恨|恚|慍|哀|悲|傷|愁|鬱|悵|惘|懼|恐|慌|悸|怖|驚|喜|樂|歡|悅|欣|羞|愧|慚|窘|妒|嫉|厭|憎|嫌|憐|憫|愛|戀|眷|執|迷|安|慰|釋|孤|寂|寞|酸|澀|痛|惱|煩|焦|躁|鬱悶|悻|愀|泫|惻|悱|繾|狂喜|悲慟/,
    boost: /心情|情緒|神色|心中|內心|感情/,
  },
  {
    id: "face",
    category: "人物描寫・面貌",
    re: /眉|眸|瞳|眼波|眼神|目光|臉|面色|臉色|氣色|頰|顴|額|唇|嘴角|淚|泣|啼|笑靨|紅暈|潮紅|煞白|蒼白|蠟黃|青灰|皺眉|蹙|粲|哂|莞爾|淚痕|淚光|面容|容顏|神情|面龐/,
    boost: /臉上|面容|容貌|五官|眉毛|眼睛|嘴唇/,
  },
  {
    id: "person",
    category: "人物描寫・辭書精選",
    re: /性情|性格|為人|氣度|風度|儀表|風采|姿態|神態|形貌|容貌|清癯|憔悴|嶙峋|豐腴|頎長|頹唐|倨傲|謙|桀驁|剛愎|優柔|狡黠|憨厚|陰鷙|寡言|多疑|瀟灑|颯爽|溫婉|端莊|倜儻|落拓|俊逸|木然|漠然|黯然|昂然/,
    boost: /形容人|指人|為人|性情/,
  },
  {
    id: "action",
    category: "動作描寫・辭書精選",
    re: /瞥|睨|盯|瞪|掃視|打量|端詳|逼視|斜視|徘徊|逡巡|踟躕|彷徨|徜徉|踱|佇|踉蹌|攥|抿|摩挲|拂|顫|僵|囁嚅|嘟噥|沉吟|喟嘆|反詰|附和|頂撞|低語|斷言|掠過|踅|戟指|拊膺|睥睨|邂逅/,
    boost: /動詞|動作|行走|觀看|說話/,
  },
  {
    id: "sense",
    category: "感官・辭書精選",
    re: /光|影|聲|音|響|味|香|臭|觸|冷|熱|濕|悶|斑駁|澄澈|炫目|昏黃|熹微|窸窣|鏗|嗡|嘎吱|凜冽|刺鼻|腥|焦苦|黯淡|刺眼|柔光|餘韻/,
    boost: /光線|聲音|氣味|觸感|感覺/,
  },
  {
    id: "scene",
    category: "景物氣氛・辭書精選",
    re: /蕭索|岑寂|闃寂|肅殺|旖旎|縹緲|空曠|逼仄|冷清|寂靜|淒清|蒼茫|浩渺|陰鬱|寧謐|謐靜|荒涼|寥廓|暮色|晨曦|夜色|煙雨|雲煙|街景/,
    boost: /風景|景物|氣氛|景象|環境/,
  },
  {
    id: "time",
    category: "時間節奏・辭書精選",
    re: /倏忽|須臾|頃刻|良久|頓挫|遲疑|剎那|片刻|轉瞬|倏然|驀然|溘然|良久|良久不|一瞬/,
    boost: /時間|片刻|忽然/,
  },
  {
    id: "craft",
    category: "文筆修辭・辭書精選",
    re: /白描|留白|用典|對仗|煉字|含蓄|隱晦|綿密|跌宕|婉約|雄渾|清麗|蒼涼|沉鬱|俏皮|反諷|鋪陳|渲染|工筆|寫意|意境|氣韻|風骨|神韻/,
    boost: /文筆|修辭|筆法|風格/,
  },
  {
    id: "color",
    category: "主題・顏色",
    re: /緋|絳|硃|丹|殷|碧|翠|蒼|黛|縞|玄|黧|彤|赭|嫣|姹|墨黑|青灰|緋紅|絳紫|蒼白|硃紅|殷紅|翠綠|黛綠|玄青/,
    boost: /顏色|色彩|色澤|紅|青|白|黑|綠/,
  },
  {
    id: "fabric",
    category: "主題・織品",
    re: /紗|羅|絹|錦|綺|綾|綢|緞|縐|紈|緙|麻|絲織|布料|羅衣|錦衣|綺羅|綢緞|綾羅/,
    boost: /絲|織|衣料|布|綢/,
  },
  {
    id: "sound",
    category: "主題・聲音",
    re: /窸窣|鏗|嗡|嘎吱|啁啾|喧嘩|喑啞|颯然|迴盪|餘韻|聲響|鳴|嘯|啼|泣|嘆|哼|囁|淅瀝|颯颯|琅琅|鏗鏘/,
    boost: /聲音|聲響|擬聲|耳|響/,
  },
  {
    id: "anger",
    category: "主題・憤怒面貌",
    re: /勃然|怫然|慍|睚眦|戟指|瞋|悻悻|厲色|怒目|變色|拂袖|拍案|咆哮|叱|詬|忿|恚/,
    boost: /怒|憤怒|不悅|臉色/,
  },
  {
    id: "speech",
    category: "對話口吻・辭書精選",
    re: /囁嚅|嘟噥|沉吟|喟嘆|反詰|附和|頂撞|低語|斷言|嘲|譏|諷|厲聲|柔聲|冷笑|苦笑|嗤|哂/,
    boost: /語氣|說話|對白|口吻/,
  },
];

function loadDump(name) {
  const p = join(__dir, name);
  if (!existsSync(p)) {
    console.warn("missing", name);
    return [];
  }
  const raw = JSON.parse(readFileSync(p, "utf8"));
  return Array.isArray(raw) ? raw : [];
}

function shortDef(def) {
  return String(def ?? "")
    .replace(/\s+/g, " ")
    .replace(/^\[.*?\]\s*/u, "")
    .split(/\n|\\n/)
    .map((x) => x.trim())
    .find((x) => x.length > 2)
    ?.replace(/^\d+\./, "")
    .trim()
    .slice(0, 140);
}

function matchTheme(term, def, theme) {
  const text = `${term} ${def}`;
  if (!theme.re.test(text)) return 0;
  let s = writingLiteracyScore(term, def);
  if (theme.boost?.test(text)) s += 18;
  if (theme.re.test(term)) s += 12;
  // Prefer 2–4 char literary surface
  if (term.length >= 2 && term.length <= 4) s += 4;
  return s;
}

const revised = loadDump("dict_revised.json");
const concised = loadDump("dict_concised.json");
const rows = [
  ...revised.map((r) => ({ ...r, dump: "revised" })),
  ...concised.map((r) => ({ ...r, dump: "concised" })),
];
console.log("scanning", rows.length, "MOE rows; per-theme", perTheme);

const globalSeen = new Set();
/** Prefer curated terms already in literary seed stay unique later via merge. */
const cards = [];
const mix = {};

for (const theme of THEMES) {
  const ranked = [];
  for (const row of rows) {
    const term = String(row.title ?? "").trim();
    const def = String(row.definition ?? "");
    if (!term || globalSeen.has(term)) continue;
    if (!passesWritingLiteracyGate(term, def)) continue;
    const s = matchTheme(term, def, theme);
    if (s < 24) continue;
    ranked.push({ row, term, def, s });
  }
  ranked.sort((a, b) => b.s - a.s);
  let n = 0;
  for (const { row, term, def, s } of ranked) {
    if (n >= perTheme) break;
    if (globalSeen.has(term)) continue;
    const short_def = shortDef(def);
    if (!short_def || short_def.length < 4) continue;
    globalSeen.add(term);
    const category = classifyVocab(term, def, theme.category);
    cards.push({
      status: "active",
      term,
      zhuyin: String(row.bopomofo || "").replace(/\s+/g, " ").trim() || null,
      part_of_speech: null,
      difficulty: /文言|舊時|語本|典出/.test(def) ? 4 : 3,
      short_def,
      long_def: def.slice(0, 800),
      usage_context: `教育部辭典主題收割（${theme.id}）。寫作篩選後收錄。`,
      register: "literary",
      category,
      tags: ["教育部收割", "主題收割", theme.id, category.split("・")[0]],
      daily_example: `寫作時依場面使用「${term}」，避免空套。`,
      literary_example: `把「${term}」落到具體感官或動作上。`,
      source: {
        kind: row.dump === "revised" ? "moe-revised-harvest" : "moe-concised-harvest",
        license: "CC BY-ND 3.0 TW",
        attribution:
          row.dump === "revised"
            ? "中華民國教育部《重編國語辭典修訂本》"
            : "中華民國教育部《國語辭典簡編本》",
        id: row.id,
        score: s,
        theme: theme.id,
      },
    });
    n += 1;
  }
  mix[theme.id] = n;
  console.log(theme.id, n);
}

const byTop = {};
for (const c of cards) {
  const t = c.category.split("・")[0];
  byTop[t] = (byTop[t] ?? 0) + 1;
}

const payload = {
  version: 1,
  count: cards.length,
  mix,
  byTop,
  filter: "moe-theme-harvest-v1",
  cards,
};

writeFileSync(join(__dir, "seed-harvested-themes.json"), JSON.stringify(payload, null, 2), "utf8");
const pub = join(__dir, "../../public/content");
mkdirSync(pub, { recursive: true });
writeFileSync(join(pub, "seed-harvested-themes.json"), JSON.stringify(payload), "utf8");
console.log("harvested", cards.length, byTop);
