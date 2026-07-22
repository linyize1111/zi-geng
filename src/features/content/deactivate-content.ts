import { getSupabaseClient } from "@/lib/supabase/client";

export type ContentKind = "vocabulary" | "quote" | "craft" | "prompt" | "novel_task";

const TABLE: Record<ContentKind, string> = {
  vocabulary: "zg_vocabulary_cards",
  quote: "zg_quotes",
  craft: "zg_craft_cards",
  prompt: "zg_writing_prompts",
  novel_task: "zg_novel_task_templates",
};

export type ContentListRow = {
  id: string;
  kind: ContentKind;
  title: string;
  subtitle: string;
  difficulty: number | null;
};

/** Soft-remove from Today / Learn pools (status → inactive). Safer than hard DELETE. */
export async function deactivateContent(kind: ContentKind, id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { error } = await client.from(TABLE[kind]).update({ status: "inactive" }).eq("id", id);
  if (error) throw error;
}

export async function deactivateMany(kind: ContentKind, ids: string[]): Promise<number> {
  if (!ids.length) return 0;
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from(TABLE[kind])
    .update({ status: "inactive" })
    .in("id", ids)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

/** Owner browse/search active cards for cleanup. */
export async function searchActiveContent(
  kind: ContentKind,
  query: string,
  limit = 40,
): Promise<ContentListRow[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const q = query.trim();
  const table = TABLE[kind];

  if (kind === "vocabulary") {
    let req = client
      .from(table)
      .select("id, term, short_def, difficulty, category")
      .eq("status", "active")
      .order("term")
      .limit(limit);
    if (q) req = req.or(`term.ilike.%${q}%,short_def.ilike.%${q}%`);
    const { data, error } = await req;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      kind,
      title: r.term as string,
      subtitle: [r.category, r.short_def].filter(Boolean).join(" · "),
      difficulty: (r.difficulty as number) ?? null,
    }));
  }

  if (kind === "quote") {
    let req = client
      .from(table)
      .select("id, display_quote, author_name, work_title, difficulty")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (q) {
      req = req.or(`display_quote.ilike.%${q}%,author_name.ilike.%${q}%,work_title.ilike.%${q}%`);
    }
    const { data, error } = await req;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      kind,
      title: (r.display_quote as string).slice(0, 80),
      subtitle: [r.author_name, r.work_title].filter(Boolean).join(" · "),
      difficulty: (r.difficulty as number) ?? null,
    }));
  }

  if (kind === "craft") {
    let req = client
      .from(table)
      .select("id, name, one_liner, difficulty")
      .eq("status", "active")
      .order("name")
      .limit(limit);
    if (q) req = req.or(`name.ilike.%${q}%,one_liner.ilike.%${q}%`);
    const { data, error } = await req;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      kind,
      title: r.name as string,
      subtitle: (r.one_liner as string) ?? "",
      difficulty: (r.difficulty as number) ?? null,
    }));
  }

  if (kind === "prompt") {
    let req = client
      .from(table)
      .select("id, title, body, difficulty, category")
      .eq("status", "active")
      .order("title")
      .limit(limit);
    if (q) req = req.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
    const { data, error } = await req;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      kind,
      title: r.title as string,
      subtitle: [r.category, (r.body as string)?.slice(0, 60)].filter(Boolean).join(" · "),
      difficulty: (r.difficulty as number) ?? null,
    }));
  }

  let req = client
    .from(table)
    .select("id, title, body, difficulty")
    .eq("status", "active")
    .order("title")
    .limit(limit);
  if (q) req = req.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
  const { data, error } = await req;
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    kind,
    title: r.title as string,
    subtitle: ((r.body as string) ?? "").slice(0, 80),
    difficulty: (r.difficulty as number) ?? null,
  }));
}
