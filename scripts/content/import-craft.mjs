/**
 * Import craft cards → zg_craft_cards (upsert by name; fills lesson columns when present).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dir = dirname(fileURLToPath(import.meta.url));
const jsonPath = process.argv[2] || join(__dir, "seed-craft-cards.json");
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

if (!url.startsWith("http") || key.length < 20) {
  console.error("Need SUPABASE_URL and service/secret key");
  process.exit(1);
}

const payload = JSON.parse(readFileSync(jsonPath, "utf8"));
const cards = payload.cards ?? payload;
if (!Array.isArray(cards) || !cards.length) {
  console.error("No cards");
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let inserted = 0;
let updated = 0;
let errors = 0;

for (const card of cards) {
  const row = {
    status: card.status ?? "active",
    name: card.name,
    one_liner: card.one_liner ?? card.hook ?? "",
    purpose: card.purpose ?? card.concept ?? "",
    bad_example: card.bad_example ?? "",
    good_example: card.good_example ?? "",
    breakdown: card.breakdown ?? (card.breakdown_steps ?? []).join(" → "),
    exercise: card.exercise ?? card.quick_drill ?? "",
    difficulty: card.difficulty ?? 3,
    tags: card.tags ?? [],
    source: card.source ?? { kind: "import" },
    module: card.module ?? null,
    lesson_order: card.lesson_order ?? null,
    hook: card.hook ?? card.one_liner ?? null,
    concept: card.concept ?? card.purpose ?? null,
    paragraph_demo: card.paragraph_demo ?? null,
    breakdown_steps: card.breakdown_steps ?? [],
    quick_drill: card.quick_drill ?? card.exercise ?? null,
    deeper_drill: card.deeper_drill ?? null,
    related_vocab_tags: card.related_vocab_tags ?? [],
    related_knowledge_topics: card.related_knowledge_topics ?? [],
    quality_score: card.quality_score ?? 80,
    quality_flags: card.quality_flags ?? [],
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: findErr } = await client
    .from("zg_craft_cards")
    .select("id")
    .eq("name", card.name)
    .maybeSingle();
  if (findErr) {
    console.error("find", card.name, findErr.message);
    errors += 1;
    continue;
  }
  if (existing) {
    const { error } = await client.from("zg_craft_cards").update(row).eq("id", existing.id);
    if (error) {
      // Columns may not exist until Phase 2–3 SQL — retry core fields
      const { error: e2 } = await client
        .from("zg_craft_cards")
        .update({
          status: row.status,
          one_liner: row.one_liner,
          purpose: row.purpose,
          bad_example: row.bad_example,
          good_example: row.good_example,
          breakdown: row.breakdown,
          exercise: row.exercise,
          difficulty: row.difficulty,
          tags: row.tags,
          source: row.source,
        })
        .eq("id", existing.id);
      if (e2) {
        console.error("update", card.name, e2.message);
        errors += 1;
      } else updated += 1;
    } else updated += 1;
  } else {
    const { error } = await client.from("zg_craft_cards").insert(row);
    if (error) {
      const { error: e2 } = await client.from("zg_craft_cards").insert({
        status: row.status,
        name: row.name,
        one_liner: row.one_liner,
        purpose: row.purpose,
        bad_example: row.bad_example,
        good_example: row.good_example,
        breakdown: row.breakdown,
        exercise: row.exercise,
        difficulty: row.difficulty,
        tags: row.tags,
        source: row.source,
      });
      if (e2) {
        console.error("insert", card.name, e2.message);
        errors += 1;
      } else inserted += 1;
    } else inserted += 1;
  }
}

console.log(`Done. inserted=${inserted} updated=${updated} errors=${errors}`);
if (errors > 0) process.exit(2);
