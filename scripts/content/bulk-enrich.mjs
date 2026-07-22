/**
 * One-shot bulk enrichment orchestrator.
 * Downloads MOE dumps, filters, crawls multi-source (bulk), merges seeds.
 *
 *   node scripts/content/bulk-enrich.mjs
 *   node scripts/content/bulk-enrich.mjs --skip-crawl
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "../..");
const skipCrawl = process.argv.includes("--skip-crawl");

function run(cmd, env = {}) {
  console.log("\n>>", cmd);
  const r = spawnSync(cmd, {
    cwd: root,
    shell: true,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) throw new Error(`failed: ${cmd}`);
}

run("npm run content:writer");
run("npm run content:themed");
run("npm run content:harvest", {/* local MOE dumps */});
run("npm run content:craft");
run("npm run content:quotes");
run("npm run content:prompts");
run("npm run content:novel-plan");

run("npm run content:download-idioms");
run("npm run content:generate", { SEED_LIMIT: "600" });

run("npm run content:download-revised");
run("npm run content:revised", { REVISED_LIMIT: "900" });

run("node scripts/content/convert-moe-concised.mjs", { CONCISED_LIMIT: "600" });

if (!skipCrawl) {
  run("npm run content:crawl -- --mode=bulk --vocab=450 --quotes=220");
}

run("npm run content:merge", {
  IDIOM_KEEP: "180",
  REVISED_KEEP: "900",
  CONCISED_KEEP: "500",
  CRAWL_KEEP: "400",
  HARVEST_KEEP: "1400",
});
console.log("\nBulk enrich complete. Import via Content sync or npm run content:import.");
