// Checks that en.js and km.js have the same keys and placeholders.
//   npm run check:i18n
import en from "../src/i18n/en.js";
import km from "../src/i18n/km.js";

const SKIP = ["values", "apiErrors"]; // Khmer-only lookup tables
const walk = (o, p = "", out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (!p && SKIP.includes(k)) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) walk(v, key, out);
    else out[key] = v;
  }
  return out;
};
const a = walk(en);
const b = walk(km);
const holes = (s) => (JSON.stringify(s).match(/\{\w+\}/g) || []).sort().join(",");
const problems = [];
for (const k of Object.keys(a)) if (!(k in b)) problems.push(`missing in km.js: ${k}`);
for (const k of Object.keys(b)) if (!(k in a)) problems.push(`missing in en.js: ${k}`);
for (const k of Object.keys(a)) {
  if (!(k in b)) continue;
  if (Array.isArray(a[k]) !== Array.isArray(b[k]) || (Array.isArray(a[k]) && a[k].length !== b[k].length))
    problems.push(`different list length: ${k}`);
  if (holes(a[k]) !== holes(b[k])) problems.push(`different {placeholders}: ${k}`);
  if (JSON.stringify(a[k]).includes('""') || JSON.stringify(b[k]).includes('""')) problems.push(`empty text: ${k}`);
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`i18n OK: ${Object.keys(a).length} texts in English and Khmer.`);
