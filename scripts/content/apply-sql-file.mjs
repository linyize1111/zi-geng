/**
 * Apply a .sql file via Supabase Management API (needs personal access token).
 * Env: SUPABASE_ACCESS_TOKEN, PROJECT_REF (default ypyiqysgfwgxcmmsylob)
 * Usage: node scripts/content/apply-sql-file.mjs path/to/file.sql
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/content/apply-sql-file.mjs <file.sql>");
  process.exit(1);
}

const token = process.env.SUPABASE_ACCESS_TOKEN || "";
const ref = process.env.PROJECT_REF || "ypyiqysgfwgxcmmsylob";
if (!token) {
  console.error("Need SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

const query = readFileSync(file, "utf8");
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query }),
});

const text = await res.text();
if (!res.ok) {
  console.error("SQL apply failed", res.status, text.slice(0, 500));
  process.exit(1);
}
console.log("SQL applied OK", file, text.slice(0, 200));
