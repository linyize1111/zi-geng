/**
 * Deterministic topic discovery from topic graph + curated snippet gaps.
 * Usage: node scripts/content/discover-knowledge-topics.mjs
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const graph = JSON.parse(readFileSync(join(__dir, "topic-graph/knowledge-topics.json"), "utf8"));

const existingPath = join(__dir, "generated/seed-knowledge-candidates.json");
const existingKeys = new Set();
if (existsSync(existingPath)) {
  try {
    const prev = JSON.parse(readFileSync(existingPath, "utf8"));
    for (const c of prev.cards ?? []) existingKeys.add(`${c.series}::${c.topic_key}`);
  } catch {
    /* ignore */
  }
}

const topics = [];
for (const s of graph.series) {
  for (const seed of s.seeds) {
    const key = `${s.id}::${seed}`;
    if (existingKeys.has(key)) continue;
    topics.push({
      series: s.id,
      seriesTitle: s.title,
      topic_key: seed,
      title_hint: `${seed}：寫作用途與異同`,
      reason: `${s.id} priority ${s.priority}; topic not yet generated`,
      source_keys: ["moe_revised_dict", "manual_curated", "public_domain_classics"],
      priority: s.priority,
    });
  }
}

topics.sort((a, b) => b.priority - a.priority);
const out = {
  generated_at: new Date().toISOString(),
  count: topics.length,
  topics: topics.slice(0, 40),
};

const genDir = join(__dir, "generated");
mkdirSync(genDir, { recursive: true });
writeFileSync(
  join(genDir, "knowledge-topic-candidates.json"),
  JSON.stringify(out, null, 2),
  "utf8",
);
console.log("topic candidates", out.count);
