/**
 * Download MOE idioms JSON (via kemdict mirror) for convert-moe-idioms.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const url =
  "https://raw.githubusercontent.com/kemdict/kemdict-data-ministry-of-education/main/dict_idioms.json";

console.log("Downloading…");
const res = await fetch(url);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
writeFileSync(join(__dir, "dict_idioms.json"), buf);
console.log("Saved dict_idioms.json", buf.length, "bytes");
