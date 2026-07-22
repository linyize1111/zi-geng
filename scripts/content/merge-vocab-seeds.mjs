/**
 * Merge writer lexicon + MOE revised literary + harder idioms → seed-literary-vocab.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));

function load(name) {
  const p = join(__dir, name);
  if (!existsSync(p)) return [];
  const j = JSON.parse(readFileSync(p, "utf8"));
  return j.cards ?? [];
}

const writer = load("seed-writer-vocab.json");
const revised = load("seed-moe-revised.json");
const idiomsAll = load("seed-idioms-raw.json");

// Prefer harder / less childish idioms if full idiom seed exists
let idioms = idiomsAll;
if (!idioms.length && existsSync(join(__dir, "seed-literary-vocab.json"))) {
  const prev = JSON.parse(readFileSync(join(__dir, "seed-literary-vocab.json"), "utf8"));
  idioms = (prev.cards ?? []).filter((c) => c.category === "成語" || c.source?.kind === "moe-idioms");
}

const IDIOM_LIMIT = Number(process.env.IDIOM_KEEP || 250);
// Keep a capped idiom slice; writer+revised first
idioms = idioms.slice(0, IDIOM_LIMIT).map((c) => ({
  ...c,
  difficulty: Math.max(3, c.difficulty ?? 3),
  tags: Array.from(new Set([...(c.tags ?? []), "成語", "輔助"])),
}));

const seen = new Set();
const cards = [];
for (const c of [...writer, ...revised, ...idioms]) {
  const term = String(c.term ?? "").trim();
  if (!term || seen.has(term)) continue;
  seen.add(term);
  cards.push(c);
}

const payload = {
  version: 2,
  count: cards.length,
  mix: { writer: writer.length, revised: revised.length, idioms: idioms.length },
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
console.log("merged", payload.mix, "total", cards.length);
