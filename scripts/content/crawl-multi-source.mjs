/**
 * Multi-source content crawler (licensed / API only).
 * Sources:
 *  - zh.wiktionary (CC BY-SA) — literary / rare lemmas via category + random
 *  - zh.wikiquote (CC BY-SA) — themed quote pages (imported for Owner review flags)
 *  - kemdict MOE idioms (CC BY-ND 3.0 TW) — via existing download script
 *
 * Does NOT scrape commercial dictionaries or paywalled quote farms.
 *
 * Usage:
 *   node scripts/content/crawl-multi-source.mjs
 *   node scripts/content/crawl-multi-source.mjs --vocab=120 --quotes=80
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split("=")[1]) : fallback;
};

const VOCAB_LIMIT = arg("vocab", 120);
const QUOTE_LIMIT = arg("quotes", 80);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WIKT = "https://zh.wiktionary.org/w/api.php";
const WIKQ = "https://zh.wikiquote.org/w/api.php";

/** Popular + obscure themed entry points */
const WIKT_CATEGORIES = [
  "Category:汉语成语",
  "Category:汉语文言词",
  "Category:汉语书面语",
  "Category:汉语贬义词",
  "Category:汉语褒义词",
  "Category:汉语动词",
  "Category:汉语形容词",
  "Category:漢語成語",
];

const WIKQ_PAGES = [
  "寫作",
  "文學",
  "時間",
  "孤獨",
  "勇氣",
  "愛情",
  "自由",
  "真理",
  "自然",
  "死亡",
  "希望",
  "失敗",
  "記憶",
  "沉默",
  "旅行",
  "藝術",
  "科學",
  "政治",
  "教育",
  "友誼",
];

async function api(base, params, attempt = 0) {
  const url = `${base}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ZiGengContentBot/1.0 (private study PWA; contact owner)" },
  });
  if (res.status === 429 && attempt < 5) {
    const wait = 1500 * (attempt + 1);
    console.warn("429 backoff", wait, "ms");
    await sleep(wait);
    return api(base, params, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function categoryMembers(base, category, limit) {
  const titles = [];
  let cont = "";
  while (titles.length < limit) {
    const data = await api(base, {
      action: "query",
      list: "categorymembers",
      cmtitle: category,
      cmnamespace: "0",
      cmlimit: "50",
      cmcontinue: cont || undefined,
    });
    for (const m of data?.query?.categorymembers ?? []) {
      if (m.title && !m.title.includes(":")) titles.push(m.title);
    }
    cont = data?.continue?.cmcontinue;
    if (!cont) break;
    await sleep(150);
  }
  return [...new Set(titles)].slice(0, limit);
}

async function randomTitles(base, limit) {
  const titles = [];
  let guard = 0;
  while (titles.length < limit && guard < 30) {
    guard += 1;
    const data = await api(base, {
      action: "query",
      list: "random",
      rnnamespace: "0",
      rnlimit: "10",
    });
    for (const r of data?.query?.random ?? []) {
      const t = String(r.title ?? "");
      // Prefer Han script lemmas for literary vocab
      if (/[\u4e00-\u9fff]/.test(t) && t.length <= 8) titles.push(t);
    }
    await sleep(400);
  }
  return [...new Set(titles)].slice(0, limit);
}

async function extractIntro(base, title) {
  const data = await api(base, {
    action: "query",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    redirects: "1",
    titles: title,
  });
  const page = Object.values(data?.query?.pages ?? {})[0];
  if (!page || page.missing != null) return null;
  const extract = String(page.extract ?? "").trim();
  if (!extract) return null;
  return extract;
}

function parseQuoteBlocks(text, pageTitle) {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out = [];
  for (const line of lines) {
    // Wikiquote plain extracts often look like: 「…」——作者
    // or "quote" - Author
    let quote = "";
    let author = pageTitle;
    const m1 = line.match(/^[「『"“](.+?)[」』"”]\s*[—–\-——]+\s*(.+)$/u);
    const m2 = line.match(/^(.+?)\s*[—–\-——]\s*(.{1,40})$/u);
    if (m1) {
      quote = m1[1].trim();
      author = m1[2].replace(/[（(].*$/, "").trim() || pageTitle;
    } else if (m2 && m2[1].length >= 8 && m2[2].length <= 40) {
      quote = m2[1].replace(/^[「『"“]|[」』"”]$/gu, "").trim();
      author = m2[2].trim();
    } else if (line.length >= 12 && line.length <= 180 && !line.startsWith("分類")) {
      quote = line.replace(/^[「『"“]|[」』"”]$/gu, "").trim();
    }
    if (quote.length >= 8 && quote.length <= 200) {
      out.push({ quote, author });
    }
  }
  return out;
}

async function crawlVocab() {
  const perCat = Math.max(8, Math.floor(VOCAB_LIMIT / (WIKT_CATEGORIES.length + 1)));
  const titles = [];
  for (const cat of WIKT_CATEGORIES) {
    try {
      const got = await categoryMembers(WIKT, cat, perCat);
      titles.push(...got.map((t) => ({ term: t, category: cat.replace("Category:", "") })));
      console.log(`wikt ${cat}: ${got.length}`);
    } catch (e) {
      console.warn("cat fail", cat, e.message);
    }
    await sleep(200);
  }
  try {
    const rnd = await randomTitles(WIKT, perCat);
    titles.push(...rnd.map((t) => ({ term: t, category: "隨機冷僻" })));
    console.log(`wikt random: ${rnd.length}`);
  } catch (e) {
    console.warn("random fail", e.message);
  }

  const seen = new Set();
  const cards = [];
  for (const { term, category } of titles) {
    if (seen.has(term) || cards.length >= VOCAB_LIMIT) continue;
    seen.add(term);
    try {
      const extract = await extractIntro(WIKT, term);
      if (!extract) continue;
      const short_def = extract.split(/\n/)[0].slice(0, 120);
      cards.push({
        status: "active",
        term,
        zhuyin: null,
        part_of_speech: null,
        difficulty: category.includes("文言") || category.includes("冷僻") ? 4 : 3,
        short_def,
        long_def: extract.slice(0, 800),
        usage_context: `來源：中文維基詞典「${category}」（CC BY-SA）。`,
        register: "literary",
        category: `維基／${category}`,
        tags: ["wiktionary", "multi-source", category],
        daily_example: "",
        literary_example: "",
        source: {
          kind: "zh.wiktionary",
          category,
          url: `https://zh.wiktionary.org/wiki/${encodeURIComponent(term)}`,
          license: "CC BY-SA",
          fetched_at: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.warn("vocab fail", term, e.message);
    }
    await sleep(450);
  }
  return cards;
}

async function crawlQuotes() {
  const cards = [];
  const seen = new Set();
  for (const page of WIKQ_PAGES) {
    if (cards.length >= QUOTE_LIMIT) break;
    try {
      const extract = await extractIntro(WIKQ, page);
      if (!extract) continue;
      const blocks = parseQuoteBlocks(extract, page);
      for (const b of blocks) {
        if (cards.length >= QUOTE_LIMIT) break;
        const key = `${b.author}::${b.quote}`;
        if (seen.has(key)) continue;
        seen.add(key);
        cards.push({
          status: "active",
          display_quote: b.quote,
          original_quote: null,
          original_language: "zh",
          author_name: b.author,
          author_bio: "",
          work_title: `維基語錄 · ${page}`,
          section_title: page,
          publication_year: null,
          translator_name: null,
          bibliography_url: `https://zh.wikiquote.org/wiki/${encodeURIComponent(page)}`,
          verification_status: "verified_secondary",
          copyright_status: "cc-by-sa",
          difficulty: 2,
          themes: [page],
          short_analysis: `主題「${page}」。來源為中文維基語錄社群編輯，屬次級查證；若出處可疑請 Owner 下架。`,
          deep_analysis: "機器擷取條目前言中的引文句；建議人工核對作者與作品後再對外分享。",
          context: `主題頁：${page}`,
          rhetorical_analysis: "",
          counterpoint: "社群語錄可能誤植作者或斷章取義，寫作引用前請另查原典。",
          writing_insight: "可練習：把這句改寫成場面，不直接引用原文。",
          reflection_questions: [`這句在「${page}」主題下還有哪些反例？`],
          imitation_exercise: "用自己的語氣寫一句同主題、但完全不同意象的句子。",
          tags: ["wikiquote", "multi-source", page],
          source: {
            kind: "zh.wikiquote",
            page,
            url: `https://zh.wikiquote.org/wiki/${encodeURIComponent(page)}`,
            license: "CC BY-SA",
            fetched_at: new Date().toISOString(),
          },
        });
      }
      console.log(`wikq ${page}: +${blocks.length}`);
    } catch (e) {
      console.warn("quote page fail", page, e.message);
    }
    await sleep(220);
  }
  return cards;
}

function mergeMoeIfPresent() {
  const moePath = join(__dir, "seed-literary-vocab.json");
  if (!existsSync(moePath)) return [];
  try {
    const payload = JSON.parse(readFileSync(moePath, "utf8"));
    return (payload.cards ?? []).slice(0, 200);
  } catch {
    return [];
  }
}

const vocab = await crawlVocab();
const quotes = await crawlQuotes();
const moe = mergeMoeIfPresent();

const outDir = join(__dir);
mkdirSync(outDir, { recursive: true });

const vocabOut = {
  version: 1,
  count: vocab.length,
  fetched_at: new Date().toISOString(),
  sources: ["zh.wiktionary"],
  cards: vocab,
};
const quoteOut = {
  version: 1,
  count: quotes.length,
  fetched_at: new Date().toISOString(),
  sources: ["zh.wikiquote"],
  cards: quotes,
};
const mergedVocab = {
  version: 1,
  count: moe.length + vocab.length,
  fetched_at: new Date().toISOString(),
  sources: ["moe-idioms", "zh.wiktionary"],
  cards: [...moe, ...vocab],
};

writeFileSync(join(__dir, "fetched-wiktionary.json"), JSON.stringify(vocabOut, null, 2), "utf8");
writeFileSync(join(__dir, "fetched-wikiquote.json"), JSON.stringify(quoteOut, null, 2), "utf8");
writeFileSync(
  join(__dir, "seed-multi-source-vocab.json"),
  JSON.stringify(mergedVocab, null, 2),
  "utf8",
);

const pub = join(__dir, "../../public/content");
mkdirSync(pub, { recursive: true });
writeFileSync(join(pub, "seed-multi-source-vocab.json"), JSON.stringify(mergedVocab), "utf8");
writeFileSync(join(pub, "seed-wikiquote.json"), JSON.stringify(quoteOut), "utf8");

console.log(
  `Done. vocab=${vocab.length} quotes=${quotes.length} moe_merged=${moe.length}. Files in scripts/content + public/content.`,
);
