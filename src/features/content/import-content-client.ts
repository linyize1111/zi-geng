import { getSupabaseClient } from "@/lib/supabase/client";
import {
  importVocabularyCards,
  type ImportResult,
  type VocabImportCard,
} from "@/features/content/import-vocab-client";

export type { ImportResult, VocabImportCard };

export type QuoteImportCard = {
  status?: string;
  display_quote: string;
  author_name: string;
  work_title?: string;
  section_title?: string | null;
  original_quote?: string | null;
  original_language?: string | null;
  author_bio?: string;
  publication_year?: number | null;
  translator_name?: string | null;
  bibliography_url?: string | null;
  verification_status?: string;
  copyright_status?: string;
  difficulty?: number;
  themes?: string[];
  short_analysis?: string;
  deep_analysis?: string;
  context?: string;
  rhetorical_analysis?: string;
  counterpoint?: string;
  writing_insight?: string;
  reflection_questions?: unknown;
  imitation_exercise?: string;
  tags?: string[];
  source?: Record<string, unknown>;
};

export { importVocabularyCards };

export async function importQuoteCards(
  cards: QuoteImportCard[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const messages: string[] = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (!card) continue;
    onProgress?.(i + 1, cards.length);
    try {
      const { data: existing, error: findErr } = await client
        .from("zg_quotes")
        .select("id")
        .eq("display_quote", card.display_quote)
        .eq("author_name", card.author_name)
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing) {
        skipped += 1;
        continue;
      }
      const { error } = await client.from("zg_quotes").insert({
        status: card.status ?? "active",
        display_quote: card.display_quote,
        original_quote: card.original_quote ?? null,
        original_language: card.original_language ?? null,
        author_name: card.author_name,
        author_bio: card.author_bio ?? "",
        work_title: card.work_title ?? "",
        section_title: card.section_title ?? null,
        publication_year: card.publication_year ?? null,
        translator_name: card.translator_name ?? null,
        bibliography_url: card.bibliography_url ?? null,
        verification_status: card.verification_status ?? "verified_secondary",
        copyright_status: card.copyright_status ?? "unknown",
        difficulty: card.difficulty ?? 3,
        themes: card.themes ?? [],
        short_analysis: card.short_analysis ?? "",
        deep_analysis: card.deep_analysis ?? "",
        context: card.context ?? "",
        rhetorical_analysis: card.rhetorical_analysis ?? "",
        counterpoint: card.counterpoint ?? "",
        writing_insight: card.writing_insight ?? "",
        reflection_questions: card.reflection_questions ?? [],
        imitation_exercise: card.imitation_exercise ?? "",
        tags: card.tags ?? [],
        source: card.source ?? { kind: "owner-import" },
      });
      if (error) throw error;
      inserted += 1;
    } catch (e) {
      errors += 1;
      if (messages.length < 8) {
        messages.push(
          `${card.display_quote.slice(0, 24)}: ${e instanceof Error ? e.message : "匯入失敗"}`,
        );
      }
    }
  }

  return { inserted, skipped, errors, messages };
}

export type PromptImportCard = {
  status?: string;
  title: string;
  body: string;
  category?: string | null;
  difficulty?: number;
  suggested_words?: number | null;
  suggested_minutes?: number | null;
  constraints?: string;
  hints?: string;
  reflection_questions?: unknown;
  tags?: string[];
  source?: Record<string, unknown>;
};

export async function importPromptCards(
  cards: PromptImportCard[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const messages: string[] = [];
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (!card) continue;
    onProgress?.(i + 1, cards.length);
    try {
      const { data: existing, error: findErr } = await client
        .from("zg_writing_prompts")
        .select("id")
        .eq("title", card.title)
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing) {
        skipped += 1;
        continue;
      }
      const { error } = await client.from("zg_writing_prompts").insert({
        status: card.status ?? "active",
        title: card.title,
        body: card.body,
        category: card.category ?? null,
        difficulty: card.difficulty ?? 3,
        suggested_words: card.suggested_words ?? null,
        suggested_minutes: card.suggested_minutes ?? null,
        constraints: card.constraints ?? "",
        hints: card.hints ?? "",
        reflection_questions: card.reflection_questions ?? [],
        tags: card.tags ?? [],
        source: card.source ?? { kind: "owner-import" },
      });
      if (error) throw error;
      inserted += 1;
    } catch (e) {
      errors += 1;
      if (messages.length < 8) {
        messages.push(`${card.title}: ${e instanceof Error ? e.message : "匯入失敗"}`);
      }
    }
  }
  return { inserted, skipped, errors, messages };
}

export type NovelTaskImportCard = {
  status?: string;
  title: string;
  body: string;
  minutes_min?: number;
  minutes_max?: number;
  difficulty?: number;
  tags?: string[];
  source?: Record<string, unknown>;
};

export async function importNovelTaskCards(
  cards: NovelTaskImportCard[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const messages: string[] = [];
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (!card) continue;
    onProgress?.(i + 1, cards.length);
    try {
      const { data: existing, error: findErr } = await client
        .from("zg_novel_task_templates")
        .select("id")
        .eq("title", card.title)
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing) {
        skipped += 1;
        continue;
      }
      const { error } = await client.from("zg_novel_task_templates").insert({
        status: card.status ?? "active",
        title: card.title,
        body: card.body,
        minutes_min: card.minutes_min ?? 5,
        minutes_max: card.minutes_max ?? 20,
        difficulty: card.difficulty ?? 3,
        tags: card.tags ?? [],
        source: card.source ?? { kind: "owner-import" },
      });
      if (error) throw error;
      inserted += 1;
    } catch (e) {
      errors += 1;
      if (messages.length < 8) {
        messages.push(`${card.title}: ${e instanceof Error ? e.message : "匯入失敗"}`);
      }
    }
  }
  return { inserted, skipped, errors, messages };
}

export type CraftImportCard = {
  status?: string;
  name: string;
  one_liner: string;
  purpose?: string;
  bad_example?: string;
  good_example?: string;
  breakdown?: string;
  exercise?: string;
  difficulty?: number;
  tags?: string[];
  source?: Record<string, unknown>;
};

export async function importCraftCards(
  cards: CraftImportCard[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const messages: string[] = [];
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (!card) continue;
    onProgress?.(i + 1, cards.length);
    try {
      const { data: existing, error: findErr } = await client
        .from("zg_craft_cards")
        .select("id")
        .eq("name", card.name)
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing) {
        skipped += 1;
        continue;
      }
      const { error } = await client.from("zg_craft_cards").insert({
        status: card.status ?? "active",
        name: card.name,
        one_liner: card.one_liner,
        purpose: card.purpose ?? "",
        bad_example: card.bad_example ?? "",
        good_example: card.good_example ?? "",
        breakdown: card.breakdown ?? "",
        exercise: card.exercise ?? "",
        difficulty: card.difficulty ?? 3,
        tags: card.tags ?? [],
        source: card.source ?? { kind: "owner-import" },
      });
      if (error) throw error;
      inserted += 1;
    } catch (e) {
      errors += 1;
      if (messages.length < 8) {
        messages.push(`${card.name}: ${e instanceof Error ? e.message : "匯入失敗"}`);
      }
    }
  }
  return { inserted, skipped, errors, messages };
}
