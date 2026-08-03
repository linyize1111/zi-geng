import { getSupabaseClient } from "@/lib/supabase/client";

export type KnowledgeListItem = {
  id: string;
  series: string;
  topic_key: string;
  title: string;
  hook: string;
  reading_time_sec?: number | null;
  difficulty?: number | null;
  tags?: string[] | null;
  quality_score?: number | null;
};

export type KnowledgeDetail = KnowledgeListItem & {
  subtitle?: string | null;
  story_md: string;
  facts: Array<{ label: string; value: string }>;
  glossary: Array<{ term: string; explanation: string }>;
  examples?: unknown[];
  quiz: Array<{ question: string; answer: string; options?: string[] }>;
  why_it_matters?: string | null;
  writing_use?: string | null;
  source_refs?: Array<{ source_key: string; title?: string; url?: string; note?: string }>;
};

export async function listKnowledge(): Promise<KnowledgeListItem[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_knowledge_cards")
    .select("id, series, topic_key, title, hook, reading_time_sec, difficulty, tags, quality_score")
    .in("status", ["active", "seed"])
    .order("quality_score", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as KnowledgeListItem[];
}

export async function getKnowledge(id: string): Promise<KnowledgeDetail | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_knowledge_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as KnowledgeDetail | null) ?? null;
}
