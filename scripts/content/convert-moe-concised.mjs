/**
 * Download + filter MOE 《國語辭典簡編本》 (CC BY-ND 3.0 TW via kemdict).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LITERARY_HINT_RE,
  passesWritingLiteracyGate,
  writingLiteracyScore,
} from "./vocab-quality.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const path = join(__dir, "dict_concised.json");
const url =
  "https://raw.githubusercontent.com/kemdict/kemdict-data-ministry-of-education/main/dict_concised.json";

if (!existsSync(path)) {
  console.log("Downloading dict_concised…");
  const res = await fetch(url, { headers: { "User-Agent": "ZiGengContentBot/1.1" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
}

const LIMIT = Number(process.env.CONCISED_LIMIT || 600);
const raw = JSON.parse(readFileSync(path, "utf8"));
if (!Array.isArray(raw)) throw new Error("Unexpected concised format");

const ranked = raw
  .map((row) => {
    const term = String(row.title ?? "").trim();
    const def = String(row.definition ?? "");
    return { row, term, def, s: writingLiteracyScore(term, def) + (LITERARY_HINT_RE.test(def) ? 10 : 0) };
  })
  .filter((x) => x.s >= 28 && passesWritingLiteracyGate(x.term, x.def))
  .sort((a, b) => b.s - a.s);

const seen = new Set();
const cards = [];
for (const { row, term, def, s } of ranked) {
  if (seen.has(term)) continue;
  seen.add(term);
  const short_def = def
    .replace(/\s+/g, " ")
    .replace(/^\[.*?\]\s*/u, "")
    .slice(0, 120);
  if (short_def.length < 4) continue;
  cards.push({
    status: "active",
    term,
    zhuyin: String(row.bopomofo || "").replace(/\s+/g, " ").trim() || null,
    part_of_speech: null,
    difficulty: LITERARY_HINT_RE.test(def) ? 3 : 3,
    short_def,
    long_def: def.slice(0, 700),
    usage_context: "教育部《國語辭典簡編本》。已做文筆／國學篩選。",
    register: "literary",
    category: LITERARY_HINT_RE.test(def) ? "簡編・書面" : "簡編・精選",
    tags: ["教育部簡編本", "文筆導向", "已篩選"],
    daily_example: `可斟酌使用「${term}」。`,
    literary_example: `語境合宜時可用「${term}」。`,
    source: {
      kind: "moe-concised",
      license: "CC BY-ND 3.0 TW",
      attribution: "中華民國教育部《國語辭典簡編本》",
      id: row.id,
      score: s,
    },
  });
  if (cards.length >= LIMIT) break;
}

writeFileSync(
  join(__dir, "seed-moe-concised.json"),
  JSON.stringify({ version: 1, count: cards.length, cards }, null, 2),
  "utf8",
);
console.log("concised cards", cards.length, "from", raw.length);
