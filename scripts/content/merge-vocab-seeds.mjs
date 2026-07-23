/**
 * Merge curated + filtered MOE dumps → seed-literary-vocab.json
 * Prefer literary / contrast / theme / writer banks over dilute MOE basics.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { filterVocabCards, rankVocabCards } from "./vocab-quality.mjs";
import { classifyVocab } from "./vocab-classify.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));

function load(name) {
  const p = join(__dir, name);
  if (!existsSync(p)) return [];
  const j = JSON.parse(readFileSync(p, "utf8"));
  return j.cards ?? [];
}

function retag(card) {
  const category = classifyVocab(
    card.term,
    `${card.short_def ?? ""} ${card.long_def ?? ""}`,
    card.category,
  );
  return {
    ...card,
    category,
    tags: Array.from(new Set([...(card.tags ?? []), category.split("・")[0]])),
  };
}

function prepare(cards, { minScore = 0, preferRank = false } = {}) {
  let list = filterVocabCards(cards, { minScore }).map(retag);
  if (preferRank) list = rankVocabCards(list);
  return list;
}

const writer = prepare(load("seed-writer-vocab.json"), { minScore: 0 });
const themed = prepare(load("seed-themed-vocab.json"), { minScore: 0 });
const themeSeries = prepare(load("seed-theme-series.json"), { minScore: 0 });
const harvested = prepare(load("seed-harvested-themes.json"), {
  minScore: 8,
  preferRank: true,
});
const revised = prepare(load("seed-moe-revised.json"), { minScore: 12, preferRank: true });
const concised = prepare(load("seed-moe-concised.json"), { minScore: 12, preferRank: true });
const crawled = prepare(load("fetched-wiktionary.json"), { minScore: 10, preferRank: true });
const idiomsAll = prepare(load("seed-idioms-raw.json"), { minScore: 6, preferRank: true });

const IDIOM_LIMIT = Number(process.env.IDIOM_KEEP || 600);
const idioms = idiomsAll.slice(0, IDIOM_LIMIT).map((c) => ({
  ...c,
  difficulty: Math.max(3, c.difficulty ?? 3),
  tags: Array.from(new Set([...(c.tags ?? []), "成語", "輔助", "已篩選"])),
}));

// Lower MOE caps: quality over raw count; curated banks first
const REVISED_KEEP = Number(process.env.REVISED_KEEP || 2200);
const CONCISED_KEEP = Number(process.env.CONCISED_KEEP || 1600);
const CRAWL_KEEP = Number(process.env.CRAWL_KEEP || 600);
const HARVEST_KEEP = Number(process.env.HARVEST_KEEP || 4500);

const seen = new Set();
const cards = [];
const sources = [
  ["themeSeries", themeSeries],
  ["themed", themed],
  ["writer", writer],
  ["harvested", harvested.slice(0, HARVEST_KEEP)],
  ["idioms", idioms],
  ["revised", revised.slice(0, REVISED_KEEP)],
  ["concised", concised.slice(0, CONCISED_KEEP)],
  ["crawled", crawled.slice(0, CRAWL_KEEP)],
];

const mix = {};
for (const [name, list] of sources) {
  let n = 0;
  for (const c of list) {
    const term = String(c.term ?? "").trim();
    if (!term || seen.has(term)) continue;
    seen.add(term);
    cards.push(c);
    n += 1;
  }
  mix[name] = n;
}

const payload = {
  version: 7,
  count: cards.length,
  mix,
  filter: "writing-literacy-v3",
  categories: "writing-taxonomy-v1",
  note: "Curated literary banks first; MOE ranked + minScore gated for 文筆 usefulness.",
  target: 8000,
  cards,
};
writeFileSync(join(__dir, "seed-literary-vocab.json"), JSON.stringify(payload, null, 2), "utf8");
writeFileSync(
  join(__dir, "literary-terms.txt"),
  cards.map((c) => c.term).join("\n") + "\n",
  "utf8",
);
const pub = join(__dir, "../../public/content");
mkdirSync(pub, { recursive: true });
writeFileSync(join(pub, "seed-literary-vocab.json"), JSON.stringify(payload), "utf8");
console.log("merged", mix, "total", cards.length);
