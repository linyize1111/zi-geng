/**
 * Filter MOE 《重編國語辭典修訂本》 → literary / writer-level cards.
 * Input: scripts/content/dict_revised.json
 * CC BY-ND 3.0 TW — format convert only.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const src = join(__dir, "dict_revised.json");
if (!existsSync(src)) {
  console.error("Missing dict_revised.json — run npm run content:download-revised");
  process.exit(1);
}

const LIMIT = Number(process.env.REVISED_LIMIT || 1200);
const WANT = new Set(
  `
濫觴 齟齬 逡巡 氤氳 侘傺 囁嚅 拊膺 睥睨 顢頇 倥傯 蕭索 熨帖 跌宕 隱晦 綿密 疏離 凝滯
慍 恚 怫然 睚眦 戟指 嶙峋 踟躕 斑駁 凜冽 澄澈 綺 縞 繾綣 觳觫 喟嘆 岑寂 兀自 驀然
倜儻 孑然 悻然 悻悻 瞋目 忿忿 勃然 綈 紈 縞素 縹緲 旖旎 邂逅 惻隱 紗 錦 羅 縐
蹉跎 忿懣 怫鬱 偃蹇 觖望 狷介 婉娩 婉約 悱惻 滄桑 干戈 社稷 阡陌 襁褓 夷然 粲然 莞爾
哂笑 哂然 喟然 倏忽 奄忽 溘然 跫然 躊躇 彷徨 徜徉 徘徊 瀟灑 颯然 颯爽 凜然 肅殺 肅穆
闃寂 綺羅 羅綺 紈袴 藍縷 襤褸 綢繆 鬱積 鬱結 悒鬱 怏怏 惻隱 紆餘 謐靜
滄海 桑田 足音 觳觫 纨袴 綈袍 鶼鰈 鬱卒 邑邑 溘逝 欻然 踧踖 踧 踖 趑趄 趑 趄
囁嚅 逡巡 睥睨 嶙峋 繾綣 喟嘆 岑寂 倜儻 孑然 驀然 兀自 戟指 睚眦 怫然 悻然 瞋目
`.split(/\s+/).filter(Boolean),
);

const LITERARY_RE =
  /文言|書面上|書面語|文語|古時|古代|書[^。]{0,8}稱|比喻|修辭|文學|典雅|婉辭|敬辭|謙辭|舊時|舊稱|書面/;
const SKIP_TITLE = new Set(
  [..."一二三四五六七八九十百千萬億的了嗎呢啊吧嘛是有在我不他人這那"],
);

const raw = JSON.parse(readFileSync(src, "utf8"));

function score(row) {
  const term = String(row.title ?? "").trim();
  const def = String(row.definition ?? "");
  let s = 0;
  if (WANT.has(term)) s += 100;
  if (LITERARY_RE.test(def)) s += 20;
  if (term.length >= 2 && term.length <= 4) s += 5;
  if (term.length === 1 && WANT.has(term)) s += 30;
  if (String(row.synonyms || "").trim()) s += 3;
  if (def.length > 80) s += 2;
  if (/\[動\]|\[形\]|\[副\]/.test(def)) s += 2;
  if (/姓。|二一四部首|阿拉伯數字/.test(def) && !WANT.has(term)) s -= 30;
  if (SKIP_TITLE.has(term)) s -= 100;
  return s;
}

const ranked = raw
  .map((row) => ({ row, s: score(row) }))
  .filter((x) => x.s >= 22)
  .sort((a, b) => b.s - a.s);

const seen = new Set();
const cards = [];
for (const { row, s } of ranked) {
  const term = String(row.title ?? "").trim();
  if (!term || seen.has(term)) continue;
  seen.add(term);
  const def = String(row.definition ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!def) continue;
  const short_def = def
    .replace(/^\[.*?\]\s*/u, "")
    .split(/\n|\\n/)
    .map((x) => x.trim())
    .find((x) => x.length > 2)
    ?.replace(/^\d+\./, "")
    .trim()
    .slice(0, 120);
  if (!short_def) continue;

  const difficulty = WANT.has(term) || /文言|古時|舊時/.test(def) ? 4 : 3;
  const category =
    term.length === 1 ? "文學單字" : LITERARY_RE.test(def) ? "書面語詞" : "國語辭典精選";

  cards.push({
    status: "active",
    term,
    zhuyin:
      String(row.bopomofo || "")
        .replace(/\s+/g, " ")
        .trim() || null,
    part_of_speech: null,
    difficulty: Math.min(5, difficulty + (s >= 100 ? 1 : 0)),
    short_def,
    long_def: def.slice(0, 900),
    usage_context: "教育部《重編國語辭典修訂本》釋義；寫作時依語域選用。",
    register: "literary",
    category,
    tags: ["教育部重編國語", "寫作者詞庫", category],
    daily_example: `敘事或議論中可斟酌使用「${term}」。`,
    literary_example: `語境合宜時，「${term}」可提高書面表達精度。`,
    source: {
      kind: "moe-revised",
      license: "CC BY-ND 3.0 TW",
      attribution: "中華民國教育部《重編國語辭典修訂本》",
      id: row.id,
      score: s,
    },
  });
  if (cards.length >= LIMIT) break;
}

const payload = { version: 1, count: cards.length, cards };
writeFileSync(join(__dir, "seed-moe-revised.json"), JSON.stringify(payload, null, 2), "utf8");
console.log("revised literary cards", cards.length, "from", raw.length);
