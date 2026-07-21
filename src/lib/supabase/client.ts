import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AUTH_STORAGE_KEY } from "@/lib/auth-keys";
import { env, hasSupabaseConfig } from "@/lib/env";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!hasSupabaseConfig()) return null;
  if (client) return client;
  client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: AUTH_STORAGE_KEY,
    },
  });
  return client;
}

/** Test helper */
export function resetSupabaseClient(): void {
  client = null;
}
