/**
 * Quality scorer for content cards (字耕 v2.4 Phase 2).
 * Pure scoring exports + optional CLI when run as main.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function scoreVocabCard(card) {
  const term = String(card.term ?? "");
  const def = `${card.short_def ?? ""} ${card.long_def ?? ""}`;
  const flags = [];
  let score = 55;

  if (term.length >= 2 && term.length <= 4) score += 8;
  if (term.length === 1) {
    score -= 5;
    flags.push("single_char");
  }
  if ((card.short_def ?? "").length >= 8) score += 6;
  if ((card.daily_example ?? "").length >= 6 || (card.literary_example ?? "").length >= 6)
    score += 8;
  if (/情緒|人物|動作|感官|主題|文筆|景物/.test(String(card.category ?? ""))) score += 10;
  if ((card.tags ?? []).includes("對照學習") || (card.tags ?? []).includes("主題卡")) score += 12;
  if (/很|非常|比較/.test(def) && def.length < 20) {
    score -= 15;
    flags.push("too_plain");
  }
  if (!card.short_def) {
    score -= 20;
    flags.push("missing_def");
  }

  score = Math.max(0, Math.min(100, score));
  return { quality_score: score, quality_flags: flags };
}

export function scoreQuoteCard(card) {
  const q = String(card.display_quote ?? "");
  const flags = [];
  let score = 50;
  if (q.length >= 8 && q.length <= 120) score += 15;
  if (card.author_name && card.author_name !== q.slice(0, 10)) score += 10;
  if (card.work_title) score += 5;
  if (card.short_analysis) score += 10;
  if (/是一位|生於|卒於|原名/.test(q)) {
    score -= 40;
    flags.push("looks_like_bio");
  }
  if (!card.author_name) {
    score -= 20;
    flags.push("missing_author");
  }
  score = Math.max(0, Math.min(100, score));
  return { quality_score: score, quality_flags: flags };
}

export function scoreKnowledgeCard(card) {
  const flags = [];
  let score = 40;
  const story = String(card.story_md ?? "");
  const hook = String(card.hook ?? "");
  if (hook.length > 0 && hook.length <= 40) score += 10;
  if (story.length >= 120 && story.length <= 500) score += 20;
  if (story.length > 600) {
    score -= 15;
    flags.push("story_too_long");
  }
  if (Array.isArray(card.facts) && card.facts.length >= 2) score += 10;
  if (Array.isArray(card.source_refs) && card.source_refs.length >= 1) score += 15;
  else {
    score -= 25;
    flags.push("missing_source_refs");
  }
  if (card.why_it_matters) score += 8;
  if (card.writing_use) score += 5;
  if (/字退之|合稱，包括/.test(story)) {
    score -= 20;
    flags.push("encyclopedia_tone");
  }
  score = Math.max(0, Math.min(100, score));
  return { quality_score: score, quality_flags: flags };
}

export function shouldAutoActivate(score, flags = []) {
  if (score < 75) return false;
  if (flags.some((f) => /missing_source|looks_like_bio|encyclopedia/.test(f))) return false;
  return true;
}

export function shouldQuarantine(score, flags = []) {
  if (score < 60) return true;
  if (flags.includes("missing_source_refs")) return true;
  if (flags.includes("looks_like_bio")) return true;
  return false;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const path = resolve(
    process.argv[2] || "scripts/content/generated/seed-knowledge-candidates.json",
  );
  if (!existsSync(path)) {
    console.error("missing", path);
    process.exit(1);
  }
  const payload = JSON.parse(readFileSync(path, "utf8"));
  const cards = payload.cards ?? [];
  let scored = 0;
  for (const c of cards) {
    const r = scoreKnowledgeCard(c);
    c.quality_score = r.quality_score;
    c.quality_flags = [...new Set([...(c.quality_flags ?? []), ...r.quality_flags])];
    if (shouldQuarantine(c.quality_score, c.quality_flags)) c.status = "quarantine";
    else if (shouldAutoActivate(c.quality_score, c.quality_flags) && c.status !== "quarantine") {
      c.status = "active";
    } else if (c.status === "active" && c.quality_score < 75) {
      c.status = "candidate";
    }
    scored += 1;
  }
  const actives = cards.filter((c) => c.status === "active");
  if (actives.length > 8) {
    actives
      .sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))
      .slice(8)
      .forEach((c) => {
        c.status = "candidate";
      });
  }
  payload.scored_at = new Date().toISOString();
  payload.mix = {
    active: cards.filter((c) => c.status === "active").length,
    candidate: cards.filter((c) => c.status === "candidate").length,
    quarantine: cards.filter((c) => c.status === "quarantine").length,
  };
  writeFileSync(path, JSON.stringify(payload, null, 2), "utf8");
  console.log("scored", scored, payload.mix);
}
