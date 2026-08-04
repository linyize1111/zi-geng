/**
 * Import knowledge candidates into Supabase.
 * node scripts/content/import-knowledge.mjs [path] [--auto-activate]
 *
 * Exit codes:
 *   0 — success, empty candidates, or missing credentials (soft skip)
 *   1 — missing input file
 *   2 — hard DB failures (missing table, all inserts/updates failed, etc.)
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dir = dirname(fileURLToPath(import.meta.url));
const jsonPath = resolve(
  process.argv[2] || join(__dir, "generated/seed-knowledge-candidates.json"),
);
const autoActivate = process.argv.includes("--auto-activate");

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

if (!existsSync(jsonPath)) {
  console.error("missing", jsonPath);
  process.exit(1);
}
if (!url || !key) {
  console.error("Missing Supabase URL/service key — skip import");
  process.exit(0);
}

const client = createClient(url, key, { auth: { persistSession: false } });
const payload = JSON.parse(readFileSync(jsonPath, "utf8"));
const cards = payload.cards ?? [];

let inserted = 0;
let updated = 0;
let skipped = 0;
let activated = 0;
let errors = 0;

if (cards.length === 0) {
  console.log({ inserted: 0, updated: 0, skipped: 0, activated: 0, errors: 0, total: 0 });
  process.exit(0);
}

for (const c of cards) {
  let status = c.status ?? "candidate";
  if (autoActivate && status === "active") activated += 1;
  if (!autoActivate && status === "active") status = "candidate";

  const row = {
    status,
    series: c.series,
    topic_key: c.topic_key,
    title: c.title,
    subtitle: c.subtitle ?? null,
    hook: c.hook,
    story_md: c.story_md,
    facts: c.facts ?? [],
    glossary: c.glossary ?? [],
    examples: c.examples ?? [],
    quiz: c.quiz ?? [],
    why_it_matters: c.why_it_matters ?? "",
    writing_use: c.writing_use ?? null,
    reading_time_sec: c.reading_time_sec ?? 90,
    difficulty: c.difficulty ?? 3,
    quality_score: c.quality_score ?? 50,
    source_refs: c.source_refs ?? [],
    quality_flags: c.quality_flags ?? [],
    tags: c.tags ?? [],
    source: c.source ?? {},
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: findErr } = await client
    .from("zg_knowledge_cards")
    .select("id, status")
    .eq("series", c.series)
    .eq("topic_key", c.topic_key)
    .maybeSingle();

  if (findErr) {
    console.error("find", c.topic_key, findErr.message);
    errors += 1;
    continue;
  }

  if (existing?.id) {
    // Don't overwrite human-edited active with weaker candidate
    if (existing.status === "active" && status !== "active") {
      skipped += 1;
      continue;
    }
    const { error } = await client.from("zg_knowledge_cards").update(row).eq("id", existing.id);
    if (error) {
      console.error("update fail", c.topic_key, error.message);
      errors += 1;
    } else {
      updated += 1;
    }
  } else {
    const { error } = await client.from("zg_knowledge_cards").insert(row);
    if (error) {
      console.error("insert fail", c.topic_key, error.message);
      errors += 1;
    } else {
      inserted += 1;
    }
  }
}

console.log({ inserted, updated, skipped, activated, errors, total: cards.length });
if (errors > 0) process.exit(2);
