import { getSupabaseClient } from "@/lib/supabase/client";

export type VocabListItem = {
  id: string;
  term: string;
  zhuyin: string | null;
  short_def: string;
  difficulty: number;
  category: string | null;
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

export async function listQuotes(): Promise<QuoteListItem[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_quotes")
    .select(QUOTE_SELECT)
    .eq("status", "active")
    .neq("copyright_status", "internal_test")
    .neq("author_name", "開發測試內容")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as QuoteListItem[]).filter((q) => !q.display_quote.includes("開發測試"));
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
  return data as QuoteListItem | null;
}

export type CraftListItem = {
  id: string;
  name: string;
  one_liner: string;
  purpose: string;
  difficulty?: number;
};

export async function listVocabulary(): Promise<VocabListItem[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_vocabulary_cards")
    .select("id, term, zhuyin, short_def, difficulty, category")
    .eq("status", "active")
    .order("term");
  if (error) throw error;
  return (data ?? []) as VocabListItem[];
}

export async function getVocabulary(id: string): Promise<VocabListItem | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_vocabulary_cards")
    .select("id, term, zhuyin, short_def, difficulty, category")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as VocabListItem | null;
}

export async function listCraft(): Promise<CraftListItem[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_craft_cards")
    .select("id, name, one_liner, purpose, difficulty")
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return (data ?? []) as CraftListItem[];
}

export async function getCraft(id: string): Promise<CraftListItem | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_craft_cards")
    .select("id, name, one_liner, purpose, difficulty")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as CraftListItem | null;
}
