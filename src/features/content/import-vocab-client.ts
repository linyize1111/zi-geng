import { getSupabaseClient } from "@/lib/supabase/client";

export type VocabImportCard = {
  status?: string;
  term: string;
  zhuyin?: string | null;
  part_of_speech?: string | null;
  difficulty?: number;
  short_def: string;
  long_def?: string;
  usage_context?: string;
  register?: string;
  category?: string | null;
  tags?: string[];
  daily_example?: string;
  literary_example?: string;
  source?: Record<string, unknown>;
};

export type ImportResult = {
  inserted: number;
  skipped: number;
  errors: number;
  messages: string[];
};

export async function importVocabularyCards(
  cards: VocabImportCard[],
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
        .from("zg_vocabulary_cards")
        .select("id")
        .eq("term", card.term)
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing) {
        skipped += 1;
        continue;
      }
      const { error } = await client.from("zg_vocabulary_cards").insert({
        status: card.status ?? "active",
        term: card.term,
        zhuyin: card.zhuyin ?? null,
        part_of_speech: card.part_of_speech ?? null,
        difficulty: card.difficulty ?? 3,
        short_def: card.short_def,
        long_def: card.long_def ?? card.short_def,
        usage_context: card.usage_context ?? "",
        register: card.register ?? "literary",
        category: card.category ?? null,
        tags: card.tags ?? [],
        daily_example: card.daily_example ?? "",
        literary_example: card.literary_example ?? "",
        source: card.source ?? { kind: "owner-import" },
      });
      if (error) throw error;
      inserted += 1;
    } catch (e) {
      errors += 1;
      if (messages.length < 8) {
        messages.push(`${card.term}: ${e instanceof Error ? e.message : "匯入失敗"}`);
      }
    }
  }

  return { inserted, skipped, errors, messages };
}
