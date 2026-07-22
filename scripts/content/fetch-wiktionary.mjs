/**
 * Fetch Chinese Wiktionary glosses for terms in literary-terms.txt
 * Output: scripts/content/fetched-wiktionary.json
 * Usage: node scripts/content/fetch-wiktionary.mjs [--limit=50]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : 80;

const termsPath = join(__dir, "literary-terms.txt");
if (!existsSync(termsPath)) {
  console.error("Missing literary-terms.txt — run generate-literary-seed.mjs first");
  process.exit(1);
}

const terms = readFileSync(termsPath, "utf8")
  .split(/\r?\n/)
  .map((t) => t.trim())
  .filter(Boolean)
  .slice(0, LIMIT);

const API = "https://zh.wiktionary.org/w/api.php";

async function fetchExtract(term) {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    redirects: "1",
    titles: term,
    format: "json",
    origin: "*",
  });
  const res = await fetch(`${API}?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page || page.missing != null) return null;
  const extract = String(page.extract ?? "").trim();
  if (!extract) return null;
  const firstLine = extract.split(/\n/)[0].slice(0, 120);
  return {
    status: "active",
    term,
    zhuyin: null,
    part_of_speech: null,
    difficulty: 3,
    short_def: firstLine,
    long_def: extract.slice(0, 800),
    usage_context: "來源：中文維基詞典（機器擷取，可再人工潤飾）。",
    register: "literary",
    category: "維基詞典",
    tags: ["wiktionary", "自動匯入"],
    daily_example: "",
    literary_example: "",
    source: {
      kind: "zh.wiktionary",
      url: `https://zh.wiktionary.org/wiki/${encodeURIComponent(term)}`,
      fetched_at: new Date().toISOString(),
    },
  };
}

const cards = [];
let fail = 0;
for (let i = 0; i < terms.length; i++) {
  const term = terms[i];
  try {
    const card = await fetchExtract(term);
    if (card) cards.push(card);
    else fail += 1;
  } catch (e) {
    fail += 1;
    console.warn("fail", term, e instanceof Error ? e.message : e);
  }
  await new Promise((r) => setTimeout(r, 200));
  if ((i + 1) % 10 === 0) console.log(`fetched ${i + 1}/${terms.length}`);
}

const out = {
  version: 1,
  count: cards.length,
  fetched_at: new Date().toISOString(),
  cards,
};
const outPath = join(__dir, "fetched-wiktionary.json");
writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
console.log(`Wrote ${cards.length} cards (fail/empty=${fail}) -> ${outPath}`);
