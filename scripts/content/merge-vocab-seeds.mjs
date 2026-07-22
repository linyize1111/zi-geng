/**
 * Merge curated + filtered MOE dumps → seed-literary-vocab.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { filterVocabCards } from "./vocab-quality.mjs";
import { classifyVocab } from "./vocab-classify.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));

function load(name) {
  const p = join(__dir, name);
  if (!existsSync(p)) return [];
  const j = JSON.parse(readFileSync(p, "utf8"));
  return j.cards ?? [];
}

function retag(card) {
  const category = classifyVocab(card.term, `${card.short_def ?? ""} ${card.long_def ?? ""}`, card.category);
  return {
    ...card,
    category,
    tags: Array.from(new Set([...(card.tags ?? []), category.split("・")[0]])),
  };
}

const writer = filterVocabCards(load("seed-writer-vocab.json")).map(retag);
const themed = filterVocabCards(load("seed-themed-vocab.json")).map(retag);
const themeSeries = filterVocabCards(load("seed-theme-series.json")).map(retag);
const harvested = filterVocabCards(load("seed-harvested-themes.json")).map(retag);
const revised = filterVocabCards(load("seed-moe-revised.json")).map(retag);
const concised = filterVocabCards(load("seed-moe-concised.json")).map(retag);
const crawled = filterVocabCards(load("fetched-wiktionary.json")).map(retag);
const idiomsAll = filterVocabCards(load("seed-idioms-raw.json")).map(retag);

const IDIOM_LIMIT = Number(process.env.IDIOM_KEEP || 200);
const idioms = idiomsAll.slice(0, IDIOM_LIMIT).map((c) => ({
  ...c,
  difficulty: Math.max(3, c.difficulty ?? 3),
  tags: Array.from(new Set([...(c.tags ?? []), "成語", "輔助", "已篩選"])),
}));

const REVISED_KEEP = Number(process.env.REVISED_KEEP || 1400);
const CONCISED_KEEP = Number(process.env.CONCISED_KEEP || 900);
const CRAWL_KEEP = Number(process.env.CRAWL_KEEP || 500);
const HARVEST_KEEP = Number(process.env.HARVEST_KEEP || 3500);

const seen = new Set();
const cards = [];
const sources = [
  ["themeSeries", themeSeries],
  ["themed", themed],
  ["writer", writer],
  ["harvested", harvested.slice(0, HARVEST_KEEP)],
  ["revised", revised.slice(0, REVISED_KEEP)],
  ["concised", concised.slice(0, CONCISED_KEEP)],
  ["crawled", crawled.slice(0, CRAWL_KEEP)],
  ["idioms", idioms],
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
  version: 6,
  count: cards.length,
  mix,
  filter: "writing-literacy-v2",
  categories: "writing-taxonomy-v1",
  target: 5000,
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
