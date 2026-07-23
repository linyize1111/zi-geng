import { getSupabaseClient } from "@/lib/supabase/client";

export type VocabListItem = {
  id: string;
  term: string;
  zhuyin: string | null;
  short_def: string;
  long_def?: string | null;
  usage_context?: string | null;
  part_of_speech?: string | null;
  difficulty: number;
  category: string | null;
  tags?: string[] | null;
  daily_example?: string | null;
  literary_example?: string | null;
};

export type QuoteListItem = {
  id: string;
  display_quote: string;
  author_name: string;
  work_title: string;
  section_title: string | null;
  original_quote: string | null;
  original_language: string | null;
  author_bio: string;
  publication_year: number | null;
  translator_name: string | null;
  bibliography_url: string | null;
  short_analysis: string;
  deep_analysis: string;
  context: string;
  rhetorical_analysis: string;
  counterpoint: string;
  writing_insight: string;
  reflection_questions: unknown;
  imitation_exercise: string;
  themes: string[];
  tags: string[];
  verification_status: string;
  copyright_status: string;
  difficulty: number;
};

const QUOTE_SELECT =
  "id, display_quote, author_name, work_title, section_title, original_quote, original_language, author_bio, publication_year, translator_name, bibliography_url, short_analysis, deep_analysis, context, rhetorical_analysis, counterpoint, writing_insight, reflection_questions, imitation_exercise, themes, tags, verification_status, copyright_status, difficulty";

const VOCAB_SELECT =
  "id, term, zhuyin, short_def, long_def, usage_context, part_of_speech, difficulty, category, tags, daily_example, literary_example";

const CRAFT_SELECT =
  "id, name, one_liner, purpose, bad_example, good_example, breakdown, exercise, difficulty, tags";

const PAGE_SIZE = 1000;

/** Supabase/PostgREST defaults to max 1000 rows — page until exhausted. */
async function fetchAllRows<T>(
  queryFactory: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await queryFactory(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const chunk = data ?? [];
    out.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return out;
}

const BIO_YEARS_RE =
  /^[\u4e00-\u9fffA-Za-z·．.\s]{1,20}[（(][^）)]{4,40}[）)].{0,8}(?:名|字|人|思想家|教育家|作家|詩人|小說家)/;
const BIO_HEAD_RE =
  /^(?:[\u4e00-\u9fffA-Za-z·．.\s]{1,24}(?:（[^）]+）|\([^)]+\))?\s*[，,]?\s*)?(?:是一位|是一个|是一個|是一名|為一[位名個个]|乃一[位名]|指的是|生於\d|卒於\d|出生於|本名|原名|字[曰為]|號曰|又名|亦名)/u;
const BIO_BODY_RE =
  /小說家|散文家|詩人|作家|文學家|劇作家|思想家|哲學家|出生於|逝世於|代表作|主要作品|英语：|英語：|维基百科|維基百科|是指|是一位|是一个|是一個/;

function looksLikeBioQuote(q: QuoteListItem): boolean {
  const text = q.display_quote?.trim() ?? "";
  if (!text || text.includes("開發測試")) return true;
  if (BIO_YEARS_RE.test(text) || BIO_HEAD_RE.test(text)) return true;
  if (
    q.author_name &&
    text.startsWith(q.author_name) &&
    BIO_BODY_RE.test(text) &&
    text.length >= 16 &&
    !/[「『""]/.test(text)
  ) {
    return true;
  }
  if (
    /^[\u4e00-\u9fffA-Za-z·．.]{1,16}是[\u4e00-\u9fff]{0,12}(?:著名)?(?:現代|当代)?(?:中國|中国)?(?:現代)?(?:著名)?(?:作家|詩人|小說家|散文家|文學家)/.test(
      text,
    )
  ) {
    return true;
  }
  if (text.length >= 60 && BIO_BODY_RE.test(text) && !/[「『""]/.test(text)) {
    const hits = text.match(BIO_BODY_RE)?.length ?? 0;
    if (hits >= 2 || /生於|卒於|出生於|逝世於|英语：|英語：/.test(text)) return true;
  }
  return false;
}

export async function listQuotes(): Promise<QuoteListItem[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const rows = await fetchAllRows<QuoteListItem>((from, to) =>
    client
      .from("zg_quotes")
      .select(QUOTE_SELECT)
      .eq("status", "active")
      .neq("copyright_status", "internal_test")
      .neq("author_name", "開發測試內容")
      .order("created_at", { ascending: false })
      .range(from, to),
  );
  return rows.filter((q) => !looksLikeBioQuote(q));
}

export async function getQuote(id: string): Promise<QuoteListItem | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_quotes")
    .select(QUOTE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  const row = data as QuoteListItem | null;
  if (!row || looksLikeBioQuote(row)) return null;
  return row;
}

export type CraftListItem = {
  id: string;
  name: string;
  one_liner: string;
  purpose: string;
  bad_example?: string | null;
  good_example?: string | null;
  breakdown?: string | null;
  exercise?: string | null;
  difficulty?: number;
  tags?: string[] | null;
};

export async function listVocabulary(): Promise<VocabListItem[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  return fetchAllRows<VocabListItem>((from, to) =>
    client
      .from("zg_vocabulary_cards")
      .select(VOCAB_SELECT)
      .eq("status", "active")
      .order("term")
      .range(from, to),
  );
}

export async function getVocabulary(id: string): Promise<VocabListItem | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_vocabulary_cards")
    .select(VOCAB_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as VocabListItem | null;
}

export async function listCraft(): Promise<CraftListItem[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  return fetchAllRows<CraftListItem>((from, to) =>
    client
      .from("zg_craft_cards")
      .select(CRAFT_SELECT)
      .eq("status", "active")
      .order("name")
      .range(from, to),
  );
}

export async function getCraft(id: string): Promise<CraftListItem | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_craft_cards")
    .select(CRAFT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as CraftListItem | null;
}
