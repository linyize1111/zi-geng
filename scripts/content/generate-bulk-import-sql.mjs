/**
 * Generate one-shot SQL to bulk-insert vocab + quotes into Supabase.
 * Usage: node scripts/content/generate-bulk-import-sql.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));

function esc(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''");
}

function arr(a) {
  if (!Array.isArray(a) || !a.length) return "'{}'::text[]";
  return `array[${a.map((x) => `'${esc(x)}'`).join(",")}]::text[]`;
}

function jsonb(obj) {
  return `'${esc(JSON.stringify(obj ?? {}))}'::jsonb`;
}

const vocab = JSON.parse(readFileSync(join(__dir, "seed-literary-vocab.json"), "utf8"));
const quotes = JSON.parse(readFileSync(join(__dir, "seed-themed-quotes.json"), "utf8"));

const lines = [];
lines.push("-- 字耕：一次灌入教育部成語 + 多主題名言（可重跑，已存在 term／名言會跳過）");
lines.push("-- Supabase SQL Editor 貼上 Run");
lines.push("");
lines.push("insert into public.zg_vocabulary_cards (");
lines.push("  status, term, zhuyin, part_of_speech, difficulty, short_def, long_def,");
lines.push("  usage_context, register, category, tags, daily_example, literary_example, source");
lines.push(")");
lines.push("select * from (values");

const vocabRows = (vocab.cards ?? []).map((c, i) => {
  const vals = [
    `'${esc(c.status ?? "active")}'`,
    `'${esc(c.term)}'`,
    c.zhuyin ? `'${esc(c.zhuyin)}'` : "null",
    c.part_of_speech ? `'${esc(c.part_of_speech)}'` : "null",
    String(c.difficulty ?? 3),
    `'${esc(c.short_def)}'`,
    `'${esc(c.long_def ?? c.short_def)}'`,
    `'${esc(c.usage_context ?? "")}'`,
    `'${esc(c.register ?? "literary")}'`,
    c.category ? `'${esc(c.category)}'` : "null",
    arr(c.tags),
    `'${esc(c.daily_example ?? "")}'`,
    `'${esc(c.literary_example ?? "")}'`,
    jsonb(c.source ?? { kind: "moe-idioms" }),
  ];
  const prefix = i === 0 ? "  (" : "  ,(";
  return `${prefix}${vals.join(", ")})`;
});
lines.push(...vocabRows);
lines.push(
  ") as v(status, term, zhuyin, part_of_speech, difficulty, short_def, long_def, usage_context, register, category, tags, daily_example, literary_example, source)",
);
lines.push("where not exists (");
lines.push("  select 1 from public.zg_vocabulary_cards c where c.term = v.term");
lines.push(");");
lines.push("");

lines.push("insert into public.zg_quotes (");
lines.push("  status, display_quote, original_quote, original_language, author_name, author_bio,");
lines.push("  work_title, section_title, publication_year, translator_name, bibliography_url,");
lines.push(
  "  verification_status, copyright_status, difficulty, themes, short_analysis, deep_analysis,",
);
lines.push("  context, rhetorical_analysis, counterpoint, writing_insight, reflection_questions,");
lines.push("  imitation_exercise, tags, source");
lines.push(")");
lines.push("select * from (values");

const quoteRows = (quotes.cards ?? []).map((c, i) => {
  const vals = [
    `'${esc(c.status ?? "active")}'`,
    `'${esc(c.display_quote)}'`,
    c.original_quote ? `'${esc(c.original_quote)}'` : "null",
    c.original_language ? `'${esc(c.original_language)}'` : "null",
    `'${esc(c.author_name)}'`,
    `'${esc(c.author_bio ?? "")}'`,
    `'${esc(c.work_title ?? "")}'`,
    c.section_title ? `'${esc(c.section_title)}'` : "null",
    c.publication_year != null ? String(c.publication_year) : "null",
    c.translator_name ? `'${esc(c.translator_name)}'` : "null",
    c.bibliography_url ? `'${esc(c.bibliography_url)}'` : "null",
    `'${esc(c.verification_status ?? "verified_secondary")}'`,
    `'${esc(c.copyright_status ?? "unknown")}'`,
    String(c.difficulty ?? 3),
    arr(c.themes),
    `'${esc(c.short_analysis ?? "")}'`,
    `'${esc(c.deep_analysis ?? "")}'`,
    `'${esc(c.context ?? "")}'`,
    `'${esc(c.rhetorical_analysis ?? "")}'`,
    `'${esc(c.counterpoint ?? "")}'`,
    `'${esc(c.writing_insight ?? "")}'`,
    jsonb(c.reflection_questions ?? []),
    `'${esc(c.imitation_exercise ?? "")}'`,
    arr(c.tags),
    jsonb(c.source ?? { kind: "import" }),
  ];
  // first column typed for values
  if (i === 0) {
    vals[0] = `${vals[0]}::text`;
  }
  const prefix = i === 0 ? "  (" : "  ,(";
  return `${prefix}${vals.join(", ")})`;
});
lines.push(...quoteRows);
lines.push(
  ") as q(status, display_quote, original_quote, original_language, author_name, author_bio, work_title, section_title, publication_year, translator_name, bibliography_url, verification_status, copyright_status, difficulty, themes, short_analysis, deep_analysis, context, rhetorical_analysis, counterpoint, writing_insight, reflection_questions, imitation_exercise, tags, source)",
);
lines.push("where not exists (");
lines.push(
  "  select 1 from public.zg_quotes x where x.display_quote = q.display_quote and x.author_name = q.author_name",
);
lines.push(");");
lines.push("");
lines.push("select");
lines.push(
  "  (select count(*) from public.zg_vocabulary_cards where status = 'active') as vocab_active,",
);
lines.push("  (select count(*) from public.zg_quotes where status = 'active') as quotes_active;");

const out = join(__dir, "../../supabase/APPLY_BULK_VOCAB_AND_QUOTES.sql");
writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(
  "Wrote",
  out,
  "vocab=",
  vocab.cards?.length,
  "quotes=",
  quotes.cards?.length,
  "bytes=",
  Buffer.byteLength(lines.join("\n")),
);
