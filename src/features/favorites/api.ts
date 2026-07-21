import { getSupabaseClient } from "@/lib/supabase/client";

export type FavoriteContentType = "vocabulary" | "quote" | "craft" | "prompt";

export type FavoriteRow = {
  id: string;
  user_id: string;
  content_type: FavoriteContentType;
  content_id: string;
  folder: string | null;
  created_at: string;
};

export type FavoriteItem = FavoriteRow & {
  title: string;
  subtitle?: string;
};

export async function listFavorites(userId: string): Promise<FavoriteItem[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");

  const { data, error } = await client
    .from("zg_favorites")
    .select("id, user_id, content_type, content_id, folder, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as FavoriteRow[];
  if (!rows.length) return [];

  const byType = (type: FavoriteContentType) =>
    rows.filter((r) => r.content_type === type).map((r) => r.content_id);

  const [vocab, quotes, craft, prompts] = await Promise.all([
    byType("vocabulary").length
      ? client
          .from("zg_vocabulary_cards")
          .select("id, term, short_def")
          .in("id", byType("vocabulary"))
      : Promise.resolve({ data: [], error: null }),
    byType("quote").length
      ? client.from("zg_quotes").select("id, display_quote, author_name").in("id", byType("quote"))
      : Promise.resolve({ data: [], error: null }),
    byType("craft").length
      ? client.from("zg_craft_cards").select("id, name, one_liner").in("id", byType("craft"))
      : Promise.resolve({ data: [], error: null }),
    byType("prompt").length
      ? client.from("zg_writing_prompts").select("id, title, body").in("id", byType("prompt"))
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const r of [vocab, quotes, craft, prompts]) {
    if (r.error) throw r.error;
  }

  const titleMap = new Map<string, { title: string; subtitle?: string }>();
  for (const v of vocab.data ?? []) {
    titleMap.set(`vocabulary:${v.id}`, { title: v.term, subtitle: v.short_def });
  }
  for (const q of quotes.data ?? []) {
    titleMap.set(`quote:${q.id}`, {
      title: q.display_quote,
      subtitle: q.author_name,
    });
  }
  for (const c of craft.data ?? []) {
    titleMap.set(`craft:${c.id}`, { title: c.name, subtitle: c.one_liner });
  }
  for (const p of prompts.data ?? []) {
    titleMap.set(`prompt:${p.id}`, { title: p.title, subtitle: p.body });
  }

  return rows.map((row) => {
    const meta = titleMap.get(`${row.content_type}:${row.content_id}`);
    return {
      ...row,
      title: meta?.title ?? "（內容已刪除或無權限）",
      subtitle: meta?.subtitle,
    };
  });
}

export async function addFavorite(
  userId: string,
  contentType: FavoriteContentType,
  contentId: string,
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { error } = await client.from("zg_favorites").upsert(
    {
      user_id: userId,
      content_type: contentType,
      content_id: contentId,
    },
    { onConflict: "user_id,content_type,content_id" },
  );
  if (error) throw error;
}

export async function removeFavorite(favoriteId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { error } = await client.from("zg_favorites").delete().eq("id", favoriteId);
  if (error) throw error;
}

export async function isFavorited(
  userId: string,
  contentType: FavoriteContentType,
  contentId: string,
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
