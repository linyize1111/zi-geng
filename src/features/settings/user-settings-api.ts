import { getSupabaseClient } from "@/lib/supabase/client";

export type UserSettings = {
  user_id: string;
  daily_mode: "light" | "standard" | "deep";
  daily_vocab_count: number;
};

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");
  const { data, error } = await client
    .from("zg_user_settings")
    .select("user_id, daily_mode, daily_vocab_count")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as UserSettings | null;
}

export async function upsertUserSettings(
  userId: string,
  patch: Partial<Pick<UserSettings, "daily_mode" | "daily_vocab_count">>,
): Promise<UserSettings> {
  const client = getSupabaseClient();
  if (!client) throw new Error("尚未設定 Supabase");

  const existing = await fetchUserSettings(userId);
  const next = {
    user_id: userId,
    daily_mode: patch.daily_mode ?? existing?.daily_mode ?? "standard",
    daily_vocab_count: patch.daily_vocab_count ?? existing?.daily_vocab_count ?? 7,
  };

  const { data, error } = await client
    .from("zg_user_settings")
    .upsert(next, { onConflict: "user_id" })
    .select("user_id, daily_mode, daily_vocab_count")
    .single();
  if (error) throw error;
  return data as UserSettings;
}
