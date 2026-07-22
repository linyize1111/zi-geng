/**
 * Filter MOE 《重編國語辭典修訂本》 with writing-literacy gate.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LITERARY_HINT_RE,
  passesWritingLiteracyGate,
  writingLiteracyScore,
} from "./vocab-quality.mjs";
import { classifyVocab } from "./vocab-classify.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const src = join(__dir, "dict_revised.json");
if (!existsSync(src)) {
  console.error("Missing dict_revised.json — run npm run content:download-revised");
  process.exit(1);
}

const LIMIT = Number(process.env.REVISED_LIMIT || 1600);

const WANT = new Set(
  `
濫觴 齟齬 逡巡 氤氳 侘傺 囁嚅 拊膺 睥睨 顢頇 倥傯 蕭索 熨帖 跌宕 隱晦 綿密 疏離 凝滯
慍 恚 怫然 睚眦 戟指 嶙峋 踟躕 斑駁 凜冽 澄澈 繾綣 觳觫 喟嘆 岑寂 兀自 驀然
倜儻 孑然 悻然 悻悻 瞋目 忿忿 勃然 縹緲 旖旎 邂逅 惻隱 蹉跎 忿懣 偃蹇 觖望 狷介
婉約 悱惻 滄桑 干戈 社稷 阡陌 襁褓 夷然 粲然 莞爾 哂笑 倏忽 溘然 躊躇 彷徨 徜徉
瀟灑 颯然 颯爽 凜然 肅殺 肅穆 闃寂 襤褸 綢繆 悒鬱 怏怏 謐靜
醍醐 管窺 郢書燕說 買櫝還珠 刻舟求劍 守株待兔 邯鄲學步 莊周夢蝶 庖丁解牛
望洋興嘆 沐猴而冠 投鼠忌器 破釜沉舟 背水一戰 四面楚歌 完璧歸趙 負荊請罪
紙上談兵 指鹿為馬 臥薪嘗膽 一鼓作氣 退避三舍 老馬識途 唇亡齒寒
知音 高山流水 陽春白雪 下里巴人 曲高和寡 風骨 氣韻 意境 意象 神韻
平仄 對仗 押韻 起承轉合 伏筆 白描 留白 反諷 用典 煉字
悵然 惘然 愀然 泫然 陶然 索然 釋然 駭然 肅然 盎然 沛然
紆餘 縞 綺 紈 羅 紗 錦 紈絲 縐 紈袴
蒹葭 窈窕 溯洄 逍遙 齊物 坐忘 浩然 蜉蝣 須臾
`.split(/\s+/).filter(Boolean),
);

const raw = JSON.parse(readFileSync(src, "utf8"));

function score(row) {
  const term = String(row.title ?? "").trim();
  const def = String(row.definition ?? "");
  if (!passesWritingLiteracyGate(term, def)) return -999;
  let s = writingLiteracyScore(term, def);
  if (WANT.has(term)) s += 100;
  if (term.length === 1 && !WANT.has(term)) s -= 20;
  return s;
}

const ranked = raw
  .map((row) => ({ row, s: score(row) }))
  .filter((x) => x.s >= 30)
  .sort((a, b) => b.s - a.s);

const seen = new Set();
const cards = [];
for (const { row, s } of ranked) {
  const term = String(row.title ?? "").trim();
  if (!term || seen.has(term)) continue;
  seen.add(term);
  const def = String(row.definition ?? "").replace(/\s+/g, " ").trim();
  const short_def = def
    .replace(/^\[.*?\]\s*/u, "")
    .split(/\n|\\n/)
    .map((x) => x.trim())
    .find((x) => x.length > 2)
    ?.replace(/^\d+\./, "")
    .trim()
    .slice(0, 140);
  if (!short_def) continue;

  const difficulty = WANT.has(term) || /文言|古時|舊時|語本|典出/.test(def) ? 4 : 3;
  const category = classifyVocab(
    term,
    def,
    WANT.has(term)
      ? /語本|典出|語出|《/.test(def)
        ? "國學典故・精選"
        : term.length === 1
          ? "國學典故・單字"
          : "文筆修辭・精選"
      : LITERARY_HINT_RE.test(def)
        ? "書面精選・辭書"
        : "書面精選・精選",
  );

  cards.push({
    status: "active",
    term,
    zhuyin: String(row.bopomofo || "").replace(/\s+/g, " ").trim() || null,
    part_of_speech: null,
    difficulty: Math.min(5, difficulty + (s >= 100 ? 1 : 0)),
    short_def,
    long_def: def.slice(0, 900),
    usage_context: "教育部《重編國語辭典修訂本》。篩選標準：文筆／國學有用，非檢定背誦。",
    register: "literary",
    category,
    tags: ["教育部重編國語", "文筆導向", "已篩選", category],
    daily_example: `寫作中依語境使用「${term}」，服務場面與語氣。`,
    literary_example: `語域合宜時，「${term}」可提高表達密度。`,
    source: {
      kind: "moe-revised",
      license: "CC BY-ND 3.0 TW",
      attribution: "中華民國教育部《重編國語辭典修訂本》",
      id: row.id,
      score: s,
      filter: "writing-literacy-v2",
    },
  });
  if (cards.length >= LIMIT) break;
}

writeFileSync(
  join(__dir, "seed-moe-revised.json"),
  JSON.stringify({ version: 2, count: cards.length, filter: "writing-literacy-v2", cards }, null, 2),
  "utf8",
);
console.log(
  "revised",
  cards.length,
  "蒙衝",
  cards.some((c) => c.term === "蒙衝"),
  "半日",
  cards.some((c) => c.term === "半日"),
  "濫觴",
  cards.some((c) => c.term === "濫觴"),
);
