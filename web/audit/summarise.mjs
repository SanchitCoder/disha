// Aggregates reports/zoom/<label>/*.json into a readable summary: issues grouped by type and page, with a screenshot path for each.
import fs from "node:fs";
import path from "node:path";
const label = process.argv[2] ?? "after";
const dir = path.resolve(import.meta.dirname, "../../reports/zoom", label);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "summary.json");
const groups = {};
let combos = 0, bad = 0;
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f)));
  combos++; if (j.issues.length) bad++;
  for (const i of j.issues) {
    const key = `${i.type} | ${j.page} | ${i.detail.replace(/\d+(\.\d+)?px/g, "Npx").slice(0, 110)}`;
    (groups[key] ??= { n: 0, example: f.replace(".json", ".png"), worst: j.zoom }).n++;
  }
}
const rows = Object.entries(groups).sort((a, b) => b[1].n - a[1].n);
const out = { label, combos, combosWithIssues: bad, distinctIssues: rows.length, issues: rows.map(([k, v]) => ({ issue: k, occurrences: v.n, screenshot: `reports/zoom/${label}/${v.example}` })) };
fs.writeFileSync(path.join(dir, "summary.json"), JSON.stringify(out, null, 1));
console.log(`${label}: ${combos} page/viewport/zoom combinations, ${bad} with problems, ${rows.length} distinct problems`);
const byType = {};
for (const [k, v] of rows) { const t = k.split(" | ")[0]; byType[t] = (byType[t] ?? 0) + v.n; }
console.log(byType);
for (const [k, v] of rows.slice(0, 40)) console.log(String(v.n).padStart(4), k, "\n       ->", `reports/zoom/${label}/${v.example}`);
