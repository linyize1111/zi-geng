/**
 * Upsert vocabulary cards into Supabase (service role).
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Usage: node scripts/content/import-vocab.mjs [path-to-json]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dir = dirname(fileURLToPath(import.meta.url));
const jsonPath = process.argv[2] || join(__dir, "seed-literary-vocab.json");

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
if (!Array.isArray(cards) || cards.length === 0) {
  console.error("No cards in", jsonPath);
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH = 50;
let inserted = 0;
let skipped = 0;
let errors = 0;

for (let i = 0; i < cards.length; i += BATCH) {
  const chunk = cards.slice(i, i + BATCH);
  for (const card of chunk) {
    const { data: existing, error: findErr } = await client
      .from("zg_vocabulary_cards")
      .select("id")
      .eq("term", card.term)
      .maybeSingle();
    if (findErr) {
      console.error("find", card.term, findErr.message);
      errors += 1;
      continue;
    }
    if (existing) {
      skipped += 1;
      continue;
    }
    const row = {
      status: card.status ?? "active",
      term: card.term,
      zhuyin: card.zhuyin ?? null,
      part_of_speech: card.part_of_speech ?? null,
      difficulty: card.difficulty ?? 3,
      short_def: card.short_def ?? "",
      long_def: card.long_def ?? card.short_def ?? "",
      usage_context: card.usage_context ?? "",
      register: card.register ?? "literary",
      category: card.category ?? null,
      tags: card.tags ?? [],
      daily_example: card.daily_example ?? "",
      literary_example: card.literary_example ?? "",
      source: card.source ?? { kind: "import" },
    };
    const { error } = await client.from("zg_vocabulary_cards").insert(row);
    if (error) {
      console.error("insert", card.term, error.message);
      errors += 1;
    } else {
      inserted += 1;
    }
  }
  process.stdout.write(`\rprocessed ${Math.min(i + BATCH, cards.length)}/${cards.length}`);
}

console.log(`\nDone. inserted=${inserted} skipped=${skipped} errors=${errors}`);
if (errors > 0) process.exit(2);
