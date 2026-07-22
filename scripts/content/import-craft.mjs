/**
 * Import craft cards → zg_craft_cards
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dir = dirname(fileURLToPath(import.meta.url));
const jsonPath = process.argv[2] || join(__dir, "seed-craft-cards.json");
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

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
let skipped = 0;
let errors = 0;

for (const card of cards) {
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
    skipped += 1;
    continue;
  }
  const { error } = await client.from("zg_craft_cards").insert({
    status: card.status ?? "active",
    name: card.name,
    one_liner: card.one_liner ?? "",
    purpose: card.purpose ?? "",
    bad_example: card.bad_example ?? "",
    good_example: card.good_example ?? "",
    breakdown: card.breakdown ?? "",
    exercise: card.exercise ?? "",
    difficulty: card.difficulty ?? 3,
    tags: card.tags ?? [],
    source: card.source ?? { kind: "import" },
  });
  if (error) {
    console.error("insert", card.name, error.message);
    errors += 1;
  } else {
    inserted += 1;
  }
}

console.log(`Done. inserted=${inserted} skipped=${skipped} errors=${errors}`);
if (errors > 0) process.exit(2);
