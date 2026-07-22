/**
 * Deactivate 字耕 self-authored maxims so daily draw prefers classical / attributed quotes.
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | SUPABASE_SECRET_KEY
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

if (!url.startsWith("http") || key.length < 20) {
  console.error("Need SUPABASE_URL and service/secret key");
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await client
  .from("zg_quotes")
  .update({ status: "inactive" })
  .eq("author_name", "字耕")
  .eq("status", "active")
  .select("id");

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Archived ${data?.length ?? 0} 字耕 self-quotes`);
