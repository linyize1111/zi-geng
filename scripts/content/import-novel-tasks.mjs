/**
 * Import novel plan tasks → zg_novel_task_templates
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | SUPABASE_SECRET_KEY
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dir = dirname(fileURLToPath(import.meta.url));
const jsonPath = process.argv[2] || join(__dir, "seed-novel-plan-tasks.json");
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
  console.error("No cards in", jsonPath);
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let inserted = 0;
let skipped = 0;
let errors = 0;

for (let i = 0; i < cards.length; i += 1) {
  const card = cards[i];
  const { data: existing, error: findErr } = await client
    .from("zg_novel_task_templates")
    .select("id")
    .eq("title", card.title)
    .maybeSingle();
  if (findErr) {
    console.error("find", card.title, findErr.message);
    errors += 1;
    continue;
  }
  if (existing) {
    skipped += 1;
  } else {
    const row = {
      status: card.status ?? "active",
      title: card.title,
      body: card.body ?? "",
      minutes_min: card.minutes_min ?? 5,
      minutes_max: card.minutes_max ?? 20,
      difficulty: card.difficulty ?? 3,
      tags: card.tags ?? [],
      source: card.source ?? { kind: "import" },
    };
    const { error } = await client.from("zg_novel_task_templates").insert(row);
    if (error) {
      console.error("insert", card.title, error.message);
      errors += 1;
    } else {
      inserted += 1;
    }
  }
  if ((i + 1) % 20 === 0 || i + 1 === cards.length) {
    console.log(`processed ${i + 1}/${cards.length}`);
  }
}

console.log(`Done. inserted=${inserted} skipped=${skipped} errors=${errors}`);
if (errors > 0) process.exit(2);
