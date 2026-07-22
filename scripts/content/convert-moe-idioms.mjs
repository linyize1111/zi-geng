/**
 * Convert MOE 《成語典》 JSON (CC BY-ND 3.0 TW) → seed-literary-vocab.json
 * Input: scripts/content/dict_idioms.json (gitignored; download separately)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const srcPath = join(__dir, "dict_idioms.json");
if (!existsSync(srcPath)) {
  console.error("Missing dict_idioms.json — download MOE idioms JSON first");
  process.exit(1);
}

const LIMIT = Number(process.env.SEED_LIMIT || 500);
const raw = JSON.parse(readFileSync(srcPath, "utf8"));
if (!Array.isArray(raw)) {
  console.error("Unexpected format");
  process.exit(1);
}

const seen = new Set();
const cards = [];
for (const row of raw) {
  const term = String(row.title ?? "").trim();
  if (!term || seen.has(term)) continue;
  seen.add(term);
  const def = String(row.definition ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!def) continue;
  const short_def = def
    .slice(0, 120)
    .replace(/\s*△.*$/, "")
    .trim();
  const example =
    String(row.書證 ?? row["書證"] ?? "")
      .split(/\n/)
      .map((s) => s.trim())
      .find((s) => s.length > 4) || "";
  const usage = String(row.用法使用類別 ?? row["用法使用類別"] ?? "").trim();
  const bopomofo = String(row.bopomofo ?? "")
    .replace(/（變）.*/u, "")
    .replace(/\s+/g, " ")
    .trim();

  cards.push({
    status: "active",
    term,
    zhuyin: bopomofo || null,
    part_of_speech: "成語",
    difficulty: 3,
    short_def,
    long_def: def.slice(0, 800),
    usage_context: usage || "教育部《成語典》釋義，寫作時依語境使用。",
    register: "literary",
    category: "成語",
    tags: ["成語", "教育部成語典", "字耕詞庫"],
    daily_example: example.slice(0, 120) || `敘事議論中可斟酌使用「${term}」。`,
    literary_example: example.slice(0, 200) || `語境合宜時，「${term}」能提高書面表達密度。`,
    source: {
      kind: "moe-idioms",
      license: "CC BY-ND 3.0 TW",
      attribution: "中華民國教育部《成語典》",
      id: row.id,
    },
  });
  if (cards.length >= LIMIT) break;
}

// Write idioms-only raw seed; merge-vocab-seeds.mjs builds the real literary mix.
const payload = { version: 1, count: cards.length, cards };
writeFileSync(join(__dir, "seed-idioms-raw.json"), JSON.stringify(payload, null, 2), "utf8");
console.log("Wrote", cards.length, "cards from MOE idioms → seed-idioms-raw.json");
