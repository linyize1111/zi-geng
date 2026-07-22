/**
 * Deactivate low-value vocab already in DB (半日 / 蒙衝-class etc.).
 */
import { createClient } from "@supabase/supabase-js";
import { BASIC_TERMS, JUNK_TERM_RE } from "./vocab-quality.mjs";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

if (!url.startsWith("http") || key.length < 20) {
  console.error("Need SUPABASE_URL and service/secret key");
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EXTRA = ["蒙衝", "艨艟", "肥皂", "半日", "整日", "縣令", "令正", "未入流", "方士", "比較"];
const denylist = [...new Set([...BASIC_TERMS, ...EXTRA])];

let deactivated = 0;
for (const term of denylist) {
  const { data, error } = await client
    .from("zg_vocabulary_cards")
    .update({ status: "inactive" })
    .eq("term", term)
    .eq("status", "active")
    .select("id");
  if (error) {
    console.warn("fail", term, error.message);
    continue;
  }
  deactivated += data?.length ?? 0;
}

// Scan a page of active cards for junk patterns (best-effort)
const { data: sample, error: sampleErr } = await client
  .from("zg_vocabulary_cards")
  .select("id, term, short_def, long_def")
  .eq("status", "active")
  .limit(2000);
if (sampleErr) {
  console.warn("sample fail", sampleErr.message);
} else {
  const junkIds = (sample ?? [])
    .filter(
      (r) =>
        JUNK_TERM_RE.test(r.term) ||
        /戰船|兵器名|清潔用品|職官名/.test(`${r.short_def}${r.long_def}`),
    )
    .map((r) => r.id);
  for (let i = 0; i < junkIds.length; i += 50) {
    const chunk = junkIds.slice(i, i + 50);
    const { data, error } = await client
      .from("zg_vocabulary_cards")
      .update({ status: "inactive" })
      .in("id", chunk)
      .select("id");
    if (!error) deactivated += data?.length ?? 0;
  }
}

console.log(`Deactivated ${deactivated} low-value vocab cards`);
