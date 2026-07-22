/**
 * Import quote JSON (service role). Same pattern as import-vocab.mjs
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Usage: node scripts/content/import-quotes.mjs [path]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dir = dirname(fileURLToPath(import.meta.url));
const jsonPath = process.argv[2] || join(__dir, "fetched-wikiquote.json");
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

if (!url.startsWith("http") || key.length < 20) {
  console.error(
    "Need SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or new sb_secret_… as SUPABASE_SECRET_KEY)",
  );
  process.exit(1);
}

const payload = JSON.parse(readFileSync(jsonPath, "utf8"));
const cards = payload.cards ?? payload;
if (!Array.isArray(cards) || !cards.length) {
  console.error("No cards in", jsonPath);
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let inserted = 0;
let skipped = 0;
let errors = 0;

for (const card of cards) {
  const { data: existing, error: findErr } = await client
    .from("zg_quotes")
    .select("id")
    .eq("display_quote", card.display_quote)
    .eq("author_name", card.author_name)
    .maybeSingle();
  if (findErr) {
    console.error("find", findErr.message);
    errors += 1;
    continue;
  }
  if (existing) {
    skipped += 1;
    continue;
  }
  const row = {
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
    source: card.source ?? { kind: "import" },
  };
  const { error } = await client.from("zg_quotes").insert(row);
  if (error) {
    console.error("insert", card.display_quote?.slice(0, 40), error.message);
    errors += 1;
  } else {
    inserted += 1;
  }
}

console.log(`Done. inserted=${inserted} skipped=${skipped} errors=${errors}`);
if (errors > 0) process.exit(2);
