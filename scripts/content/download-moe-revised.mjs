/**
 * Download MOE dict_revised.json (large ~60–90MB)
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const url =
  "https://raw.githubusercontent.com/kemdict/kemdict-data-ministry-of-education/main/dict_revised.json";

console.log("Downloading dict_revised (large)…");
const res = await fetch(url, { headers: { "User-Agent": "ZiGengContentBot/1.0" } });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(join(__dir, "dict_revised.json"), buf);
console.log("Saved dict_revised.json", buf.length, "bytes");
