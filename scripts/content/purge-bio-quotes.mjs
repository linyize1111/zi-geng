/**
 * Soft-deactivate encyclopedia bios wrongly stored as quotes.
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { isLikelyBioNotQuote } from "./quote-quality.mjs";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

if (!url.startsWith("http") || key.length < 20) {
  console.error("Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PAGE = 1000;
let offset = 0;
let scanned = 0;
let deactivated = 0;
const badIds = [];

while (true) {
  const { data, error } = await client
    .from("zg_quotes")
    .select("id, display_quote, author_name, work_title, status, tags, source")
    .eq("status", "active")
    .range(offset, offset + PAGE - 1);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (!data?.length) break;
  scanned += data.length;
  for (const row of data) {
    const tags = Array.isArray(row.tags) ? row.tags : [];
    const fromWikq =
      tags.includes("zh.wikiquote") ||
      tags.includes("wikiquote") ||
      tags.includes("multi-source") ||
      String(row.work_title ?? "").includes("維基語錄");
    if (isLikelyBioNotQuote(row) || (fromWikq && isLikelyBioNotQuote(row))) {
      badIds.push(row.id);
    } else if (fromWikq && isLikelyBioNotQuote({ ...row, display_quote: row.display_quote })) {
      badIds.push(row.id);
    }
    // Extra: author page bios often start with author name + 是
    if (
      fromWikq &&
      typeof row.display_quote === "string" &&
      row.author_name &&
      row.display_quote.includes(row.author_name) &&
      /是|為|作家|小說家|詩人/.test(row.display_quote) &&
      row.display_quote.length > 40
    ) {
      badIds.push(row.id);
    }
  }
  if (data.length < PAGE) break;
  offset += PAGE;
}

const unique = [...new Set(badIds)];
console.log("scanned", scanned, "flagged", unique.length);

for (let i = 0; i < unique.length; i += 50) {
  const chunk = unique.slice(i, i + 50);
  const { error } = await client.from("zg_quotes").update({ status: "inactive" }).in("id", chunk);
  if (error) {
    console.error("deactivate", error.message);
    process.exit(1);
  }
  deactivated += chunk.length;
}

console.log("deactivated", deactivated);
