/**
 * Multi-source crawler — licensed APIs / open dumps only.
 *
 * Sources:
 *  - zh.wiktionary (CC BY-SA)
 *  - zh.wikiquote (CC BY-SA)
 *  - zh.wikisource (CC BY-SA / PD classical)
 *  - zh.wikipedia (CC BY-SA) — literary lists / 典故 entry points
 *
 * Modes:
 *   --mode=update  smaller incremental (weekly)
 *   --mode=bulk    large one-shot enrichment
 *
 * Usage:
 *   node scripts/content/crawl-multi-source.mjs --mode=bulk
 *   node scripts/content/crawl-multi-source.mjs --mode=update --vocab=80 --quotes=40
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { filterVocabCards, passesWritingLiteracyGate } from "./vocab-quality.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const argNum = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split("=")[1]) : fallback;
};
const argStr = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
};

const MODE = argStr("mode", "update");
const IS_BULK = MODE === "bulk";
const VOCAB_LIMIT = argNum("vocab", IS_BULK ? 500 : 80);
const QUOTE_LIMIT = argNum("quotes", IS_BULK ? 250 : 40);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WIKT = "https://zh.wiktionary.org/w/api.php";
const WIKQ = "https://zh.wikiquote.org/w/api.php";
const WIKS = "https://zh.wikisource.org/w/api.php";
const WIKP = "https://zh.wikipedia.org/w/api.php";

const WIKT_CATEGORIES = [
  "Category:汉语文言词",
  "Category:漢語文言詞",
  "Category:汉语书面语",
  "Category:漢語書面語",
  "Category:汉语成语",
  "Category:漢語成語",
  "Category:汉语贬义词",
  "Category:汉语褒义词",
  "Category:汉语动词",
  "Category:汉语形容词",
  "Category:汉语副词",
  "Category:汉语拟声词",
  "Category:漢語四字詞語",
  "Category:汉语典故",
  "Category:文言文",
  "Category:漢語 情緒",
  "Category:漢語 恐懼",
  "Category:漢語 快樂",
  "Category:漢語 愛",
  "Category:漢語 憤怒",
  "Category:漢語 悲傷",
  "Category:汉语拟声词",
];

const WIKQ_THEME_PAGES = [
  "寫作", "文學", "時間", "孤獨", "勇氣", "愛情", "自由", "真理", "自然", "死亡",
  "希望", "失敗", "記憶", "沉默", "旅行", "藝術", "教育", "友誼", "青春", "戰爭",
  "正義", "命運", "夢想", "家庭", "金錢", "權力", "恐懼", "悔恨", "寬恕", "智慧",
  "詩歌", "小說", "戲劇", "音樂", "美", "醜", "善", "惡", "信仰", "懷疑",
];

const WIKQ_AUTHOR_PAGES = [
  "孔子", "孟子", "莊子", "老子", "荀子", "韓非子", "屈原", "司馬遷",
  "陶淵明", "李白", "杜甫", "白居易", "蘇軾", "李清照", "辛棄疾", "曹雪芹",
  "魯迅", "胡適", "朱自清", "徐志摩", "沈從文", "老舍", "巴金",
];

const WIKS_PAGES = [
  "詩經/關雎", "詩經/蒹葭", "楚辭/離騷", "論語/學而", "孟子/梁惠王上",
  "莊子/逍遙遊", "古文觀止/岳陽樓記", "古文觀止/醉翁亭記", "古文觀止/赤壁賦",
  "唐詩三百首/靜夜思", "唐詩三百首/登鸛雀樓", "唐詩三百首/春曉",
  "宋詞三百首/水調歌頭·明月幾時有", "宋詞三百首/聲聲慢·尋尋覓覓",
];

const WIKP_LIST_PAGES = [
  "成語列表", "中國典故列表", "四字熟語列表", "歇後語列表",
];

async function api(base, params, attempt = 0) {
  const url = `${base}?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ZiGengContentBot/1.1 (private study PWA; multi-source ingest)" },
  });
  if (res.status === 429 && attempt < 8) {
    const wait = 2500 * (attempt + 1);
    console.warn("429 backoff", wait, "ms");
    await sleep(wait);
    return api(base, params, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
    await sleep(400);
  }
  // Fallback: MediaWiki search if category empty / renamed
  if (!titles.length) {
    const q = category.replace(/^Category:/, "").replace(/汉语|漢語/g, "");
    try {
      const data = await api(base, {
        action: "query",
        list: "search",
        srsearch: q || "文言",
        srnamespace: "0",
        srlimit: String(Math.min(50, limit)),
      });
      for (const hit of data?.query?.search ?? []) {
        if (hit.title && !hit.title.includes(":")) titles.push(hit.title);
      }
    } catch {
      /* ignore */
    }
  }
  return [...new Set(titles)].slice(0, limit);
}

async function randomTitles(base, limit) {
  const titles = [];
  let guard = 0;
  while (titles.length < limit && guard < 40) {
    guard += 1;
    const data = await api(base, {
      action: "query",
      list: "random",
      rnnamespace: "0",
      rnlimit: "12",
    });
    for (const r of data?.query?.random ?? []) {
      const t = String(r.title ?? "");
      if (/[\u4e00-\u9fff]/.test(t) && t.length <= 8 && passesWritingLiteracyGate(t)) {
        titles.push(t);
      }
    }
    await sleep(280);
  }
  return [...new Set(titles)].slice(0, limit);
}

async function extractText(base, title, { introOnly = true } = {}) {
  const data = await api(base, {
    action: "query",
    prop: "extracts",
    ...(introOnly ? { exintro: "1" } : { exlimit: "1", explaintext: "1" }),
    explaintext: "1",
    redirects: "1",
    titles: title,
  });
  const page = Object.values(data?.query?.pages ?? {})[0];
  if (!page || page.missing != null) return null;
  const extract = String(page.extract ?? "").trim();
  return extract || null;
}

function parseQuoteBlocks(text, pageTitle, { requireAuthor = false } = {}) {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out = [];
  for (const line of lines) {
    let quote = "";
    let author = "";
    const m1 = line.match(/^[「『"“](.+?)[」』"”]\s*[—–\-——]+\s*(.+)$/u);
    const m2 = line.match(/^(.+?)\s*[—–\-——]\s*(.{1,40})$/u);
    if (m1) {
      quote = m1[1].trim();
      author = m1[2].replace(/[（(].*$/, "").trim();
    } else if (m2 && m2[1].length >= 8 && m2[2].length <= 40) {
      quote = m2[1].replace(/^[「『"“]|[」』"”]$/gu, "").trim();
      author = m2[2].trim();
    } else if (
      !requireAuthor &&
      line.length >= 10 &&
      line.length <= 160 &&
      !/^(分類|參見|外部|延伸|參考)/.test(line) &&
      /[\u4e00-\u9fff]/.test(line)
    ) {
      // Author pages: bare lines may be quotes by that author.
      quote = line.replace(/^[「『"“]|[」』"”]$/gu, "").trim();
      author = pageTitle;
    }
    // Never treat the theme/topic page title as the speaker.
    if (!author || author === pageTitle && requireAuthor) continue;
    if (requireAuthor && (!author || author === pageTitle)) continue;
    if (quote.length >= 8 && quote.length <= 200) out.push({ quote, author });
  }
  return out;
}

function quoteCard({ quote, author, page, sourceKind, url, themes, copyright = "cc-by-sa" }) {
  return {
    status: "active",
    display_quote: quote,
    original_quote: quote,
    original_language: "zh",
    author_name: author,
    author_bio: "",
    work_title: page,
    section_title: themes?.[0] ?? null,
    publication_year: null,
    translator_name: null,
    bibliography_url: url,
    verification_status: "verified_secondary",
    copyright_status: copyright,
    difficulty: 3,
    themes: themes ?? [],
    short_analysis: `多來源擷取（${sourceKind}）。次級查證；可疑請下架。`,
    deep_analysis: "機器擷取；寫作引用前請核對原典。",
    context: page,
    rhetorical_analysis: "",
    counterpoint: "社群／列表來源可能誤植，勿盲目當金句。",
    writing_insight: "化用場面，避免空喊原句。",
    reflection_questions: ["若改寫成現代場景，哪個意象必須保留？"],
    imitation_exercise: "用自己的物象重寫核心關係，不抄原句。",
    tags: ["multi-source", sourceKind, ...(themes ?? [])],
    source: {
      kind: sourceKind,
      page,
      url,
      license: copyright === "public_domain" ? "PD/CC" : "CC BY-SA",
      fetched_at: new Date().toISOString(),
    },
  };
}

async function crawlWiktionaryVocab() {
  const cats = IS_BULK ? WIKT_CATEGORIES : WIKT_CATEGORIES.slice(0, 6);
  const perCat = Math.max(6, Math.floor(VOCAB_LIMIT / (cats.length + 1)));
  const titles = [];
  for (const cat of cats) {
    try {
      const got = await categoryMembers(WIKT, cat, perCat);
      titles.push(...got.map((t) => ({ term: t, category: cat.replace(/^Category:/, "") })));
      console.log(`wikt ${cat}: ${got.length}`);
    } catch (e) {
      console.warn("wikt cat fail", cat, e.message);
    }
    await sleep(160);
  }
  try {
    const rnd = await randomTitles(WIKT, perCat);
    titles.push(...rnd.map((t) => ({ term: t, category: "隨機冷僻" })));
    console.log(`wikt random: ${rnd.length}`);
  } catch (e) {
    console.warn("wikt random fail", e.message);
  }

  const seen = new Set();
  const cards = [];
  for (const { term, category } of titles) {
    if (seen.has(term) || cards.length >= VOCAB_LIMIT) continue;
    if (!passesWritingLiteracyGate(term)) continue;
    seen.add(term);
    try {
      const extract = await extractText(WIKT, term);
      if (!extract || !passesWritingLiteracyGate(term, extract)) continue;
      const short_def = extract.split(/\n/)[0].slice(0, 120);
      cards.push({
        status: "active",
        term,
        zhuyin: null,
        part_of_speech: null,
        difficulty: /文言|冷僻|典故/.test(category) ? 4 : 3,
        short_def,
        long_def: extract.slice(0, 800),
        usage_context: `來源：中文維基詞典「${category}」（CC BY-SA）。文筆／國學篩選後收錄。`,
        register: "literary",
        category: `維基詞典・${category}`,
        tags: ["wiktionary", "multi-source", "已篩選", category],
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
      console.warn("wikt fail", term, e.message);
    }
    await sleep(IS_BULK ? 550 : 450);
  }
  return cards;
}

async function crawlWikipediaListVocab() {
  if (!IS_BULK) return [];
  const cards = [];
  const seen = new Set();
  for (const page of WIKP_LIST_PAGES) {
    try {
      const extract = await extractText(WIKP, page, { introOnly: false });
      if (!extract) continue;
      // Pull short Han tokens that look like idioms / lemmas
      const tokens = extract.match(/[\u4e00-\u9fff]{2,8}/g) ?? [];
      for (const term of tokens) {
        if (cards.length >= Math.min(120, Math.floor(VOCAB_LIMIT / 3))) break;
        if (seen.has(term) || !passesWritingLiteracyGate(term)) continue;
        if (term.length < 2) continue;
        seen.add(term);
        cards.push({
          status: "active",
          term,
          zhuyin: null,
          part_of_speech: null,
          difficulty: 3,
          short_def: `見維基百科列表「${page}」相關條目（需另查辭典釋義）。`,
          long_def: `詞條由維基百科「${page}」列表機器收錄，僅作詞彙發現；寫作使用前請對照正式辭典。`,
          usage_context: "來源：中文維基百科列表（CC BY-SA）。屬索引卡，釋義偏薄。",
          register: "literary",
          category: "維基百科・詞彙發現",
          tags: ["wikipedia", "multi-source", "索引", page],
          daily_example: "",
          literary_example: "",
          source: {
            kind: "zh.wikipedia",
            page,
            url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(page)}`,
            license: "CC BY-SA",
            fetched_at: new Date().toISOString(),
          },
        });
      }
      console.log(`wiki list ${page}: tokens→${cards.length}`);
    } catch (e) {
      console.warn("wiki list fail", page, e.message);
    }
    await sleep(250);
  }
  return cards;
}

async function crawlWikiquote() {
  const themePages = IS_BULK ? WIKQ_THEME_PAGES : WIKQ_THEME_PAGES.slice(0, 12);
  const authorPages = IS_BULK ? WIKQ_AUTHOR_PAGES : WIKQ_AUTHOR_PAGES.slice(0, 8);
  const cards = [];
  const seen = new Set();

  // Theme pages: only keep lines that explicitly name an author (never use topic as author).
  for (const page of themePages) {
    if (cards.length >= QUOTE_LIMIT) break;
    try {
      const extract = await extractText(WIKQ, page);
      if (!extract) continue;
      const blocks = parseQuoteBlocks(extract, page, { requireAuthor: true }).filter(
        (b) => b.author && b.author !== page && b.author.length <= 40,
      );
      for (const b of blocks) {
        if (cards.length >= QUOTE_LIMIT) break;
        const key = `${b.author}::${b.quote}`;
        if (seen.has(key)) continue;
        seen.add(key);
        cards.push(
          quoteCard({
            quote: b.quote,
            author: b.author,
            page: b.author,
            sourceKind: "zh.wikiquote",
            url: `https://zh.wikiquote.org/wiki/${encodeURIComponent(page)}`,
            themes: [page],
          }),
        );
      }
      console.log(`wikq theme ${page}: +${blocks.length}`);
    } catch (e) {
      console.warn("wikq fail", page, e.message);
    }
    await sleep(200);
  }

  // Author pages: page title is a real person; bare lines OK.
  for (const page of authorPages) {
    if (cards.length >= QUOTE_LIMIT) break;
    try {
      const extract = await extractText(WIKQ, page);
      if (!extract) continue;
      const blocks = parseQuoteBlocks(extract, page, { requireAuthor: false });
      for (const b of blocks) {
        if (cards.length >= QUOTE_LIMIT) break;
        const author = b.author && b.author !== page ? b.author : page;
        // Skip encyclopedia intros mistaken as quotes (too essay-like / no quote marks feel)
        if (/^.{0,20}(是|為|指|生於|卒於)/.test(b.quote) && b.quote.length > 60) continue;
        const key = `${author}::${b.quote}`;
        if (seen.has(key)) continue;
        seen.add(key);
        cards.push(
          quoteCard({
            quote: b.quote,
            author,
            page,
            sourceKind: "zh.wikiquote",
            url: `https://zh.wikiquote.org/wiki/${encodeURIComponent(page)}`,
            themes: [page],
          }),
        );
      }
      console.log(`wikq author ${page}: +${blocks.length}`);
    } catch (e) {
      console.warn("wikq fail", page, e.message);
    }
    await sleep(200);
  }
  return cards;
}

async function crawlWikisourceQuotes() {
  const pages = IS_BULK ? WIKS_PAGES : WIKS_PAGES.slice(0, 6);
  const cards = [];
  const seen = new Set();
  for (const page of pages) {
    if (cards.length >= Math.floor(QUOTE_LIMIT / 2)) break;
    try {
      const extract = await extractText(WIKS, page, { introOnly: false });
      if (!extract) continue;
      // Take first few classical sentences
      const chunks = extract
        .replace(/\s+/g, "")
        .split(/[。！？]/g)
        .map((s) => s.trim())
        .filter((s) => s.length >= 8 && s.length <= 80);
      const authorGuess = page.split("/")[0] ?? "古典";
      for (const q of chunks.slice(0, 4)) {
        if (seen.has(q)) continue;
        seen.add(q);
        cards.push(
          quoteCard({
            quote: q + "。",
            author: authorGuess,
            page: `維基文庫 · ${page}`,
            sourceKind: "zh.wikisource",
            url: `https://zh.wikisource.org/wiki/${encodeURIComponent(page)}`,
            themes: ["古典", authorGuess],
            copyright: "public_domain",
          }),
        );
      }
      console.log(`wikisource ${page}: +chunks`);
    } catch (e) {
      console.warn("wikisource fail", page, e.message);
    }
    await sleep(220);
  }
  return cards;
}

console.log(`crawl mode=${MODE} vocab≤${VOCAB_LIMIT} quotes≤${QUOTE_LIMIT}`);

const wikt = await crawlWiktionaryVocab();
const wikiList = await crawlWikipediaListVocab();
const vocab = filterVocabCards([...wikt, ...wikiList]).slice(0, VOCAB_LIMIT);

const wikq = await crawlWikiquote();
const wiks = await crawlWikisourceQuotes();
const quotes = [...wikq, ...wiks].slice(0, QUOTE_LIMIT);

const vocabOut = {
  version: 2,
  mode: MODE,
  count: vocab.length,
  fetched_at: new Date().toISOString(),
  sources: ["zh.wiktionary", "zh.wikipedia"],
  cards: vocab,
};
const quoteOut = {
  version: 2,
  mode: MODE,
  count: quotes.length,
  fetched_at: new Date().toISOString(),
  sources: ["zh.wikiquote", "zh.wikisource"],
  cards: quotes,
};

mkdirSync(__dir, { recursive: true });
writeFileSync(join(__dir, "fetched-wiktionary.json"), JSON.stringify(vocabOut, null, 2), "utf8");
writeFileSync(join(__dir, "fetched-wikiquote.json"), JSON.stringify(quoteOut, null, 2), "utf8");
writeFileSync(
  join(__dir, "seed-multi-source-vocab.json"),
  JSON.stringify(vocabOut, null, 2),
  "utf8",
);

const pub = join(__dir, "../../public/content");
mkdirSync(pub, { recursive: true });
writeFileSync(join(pub, "seed-multi-source-vocab.json"), JSON.stringify(vocabOut), "utf8");
writeFileSync(join(pub, "seed-wikiquote.json"), JSON.stringify(quoteOut), "utf8");

console.log(
  `Done. mode=${MODE} vocab=${vocab.length} quotes=${quotes.length} (wikt=${wikt.length} wikiList=${wikiList.length} wikq=${wikq.length} wiks=${wiks.length})`,
);
