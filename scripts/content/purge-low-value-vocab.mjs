/**
 * Deactivate low-value vocab already in DB (school basics / plain fillers / junk).
 */
import { createClient } from "@supabase/supabase-js";
import { BASIC_TERMS, JUNK_TERM_RE, PLAIN_ALONE_TERMS, BASIC_TERM_RE } from "./vocab-quality.mjs";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

if (!url.startsWith("http") || key.length < 20) {
  console.error("Need SUPABASE_URL and service/secret key");
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EXTRA = [
  "蒙衝",
  "艨艟",
  "肥皂",
  "半日",
  "整日",
  "縣令",
  "令正",
  "未入流",
  "方士",
  "比較",
  "空白",
  "堆積",
  "漂亮",
  "好看",
  "開心",
  "快樂",
  "高興",
  "普通",
  "一般",
  "非常",
  "十分",
  "東西",
  "事情",
  "地方",
  "時候",
  "樣子",
  "感覺",
  "想法",
  "意思",
  "辦法",
  "問題",
];
const denylist = [...new Set([...BASIC_TERMS, ...PLAIN_ALONE_TERMS, ...EXTRA])];

let deactivated = 0;
for (const term of denylist) {
  const { data, error } = await client
    .from("zg_vocabulary_cards")
    .update({ status: "inactive" })
    .eq("term", term)
    .eq("status", "active")
    .select("id");
  if (error) {
    console.warn("fail", term, error.message);
    continue;
  }
  deactivated += data?.length ?? 0;
}

// Scan active cards for junk / plain patterns (paged)
let offset = 0;
const pageSize = 1000;
for (;;) {
  const { data: sample, error: sampleErr } = await client
    .from("zg_vocabulary_cards")
    .select("id, term, short_def, long_def")
    .eq("status", "active")
    .range(offset, offset + pageSize - 1);
  if (sampleErr) {
    console.warn("sample fail", sampleErr.message);
    break;
  }
  if (!sample?.length) break;

  const junkIds = sample
    .filter((r) => {
      const t = r.term ?? "";
      const d = `${r.short_def ?? ""}${r.long_def ?? ""}`;
      if (BASIC_TERMS.has(t) || PLAIN_ALONE_TERMS.has(t) || BASIC_TERM_RE.test(t)) return true;
      if (JUNK_TERM_RE.test(t)) return true;
      if (/戰船|兵器名|清潔用品|職官名|鳥名|蟲名|魚名|獸名/.test(d)) return true;
      return false;
    })
    .map((r) => r.id);

  for (let i = 0; i < junkIds.length; i += 50) {
    const chunk = junkIds.slice(i, i + 50);
    const { data, error } = await client
      .from("zg_vocabulary_cards")
      .update({ status: "inactive" })
      .in("id", chunk)
      .select("id");
    if (!error) deactivated += data?.length ?? 0;
  }

  if (sample.length < pageSize) break;
  offset += pageSize;
  if (offset > 20000) break;
}

console.log(`Deactivated ${deactivated} low-value vocab cards`);
