// Payslip accuracy test. Sends every payslip that has an answer key to the
// running dev server, compares each field and each check, and prints the cost.
// Run: npm run dev (in another terminal), then: node scripts/accuracy.mjs
// Each run spends real API credit (about 1-3 cents per payslip).
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const API = process.env.API ?? "http://localhost:3000/api/payslip";
const SETS = ["test-docs/answers.json", "test-docs/real/answers.json"].filter(existsSync);
const TYPES = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

const same = (got, want) =>
  want === null ? got === null : got !== null && Math.abs(got - want) < 0.015;

async function check(file, key) {
  const bytes = await readFile(file);
  const body = new FormData();
  body.append("file", new Blob([bytes], { type: TYPES[path.extname(file).toLowerCase()] }), path.basename(file));
  const res = await fetch(API, { method: "POST", body });
  const json = await res.json();
  if (!res.ok) return { file, error: json.error ?? res.status, cost: json.usage?.cost_usd ?? 0 };

  const wrongFields = [];
  let fields = 0;
  for (const [name, want] of Object.entries(key.fields)) {
    fields++;
    const got = json.payslip[name]?.value ?? null;
    if (!same(got, want)) wrongFields.push(`${name}: got ${got}, want ${want}`);
  }
  const gotIssues = Object.fromEntries(json.report.issues.map((i) => [i.id, i.level]));
  const missed = Object.entries(key.issues).filter(([id, lvl]) => gotIssues[id] !== lvl).map(([id, lvl]) => `${id} (${lvl})`);
  const extra = Object.entries(gotIssues).filter(([id]) => !(id in key.issues)).map(([id, lvl]) => `${id} (${lvl})`);
  return { file, fields, wrongFields, planted: Object.keys(key.issues).length, missed, extra, cost: json.usage?.cost_usd ?? 0, report: json.report };
}

const jobs = [];
for (const set of SETS) {
  const keys = JSON.parse(await readFile(set, "utf8"));
  for (const [name, key] of Object.entries(keys)) if (!name.startsWith("_")) jobs.push(check(path.join(path.dirname(set), name), key));
}
const results = await Promise.all(jobs);

let fields = 0, wrong = 0, planted = 0, missed = 0, extra = 0, cost = 0;
for (const r of results) {
  cost += r.cost;
  if (r.error) { console.log(`✗ ${r.file}: ${r.error}`); continue; }
  fields += r.fields; wrong += r.wrongFields.length; planted += r.planted; missed += r.missed.length; extra += r.extra.length;
  const okAll = !r.wrongFields.length && !r.missed.length && !r.extra.length;
  console.log(`${okAll ? "✓" : "✗"} ${r.file}  fields ${r.fields - r.wrongFields.length}/${r.fields}  $${r.cost.toFixed(4)}`);
  for (const w of r.wrongFields) console.log(`    wrong  ${w}`);
  for (const m of r.missed) console.log(`    missed ${m}`);
  for (const e of r.extra) console.log(`    extra  ${e}`);
  // SHOW=1 also prints the gray info cards and yellow tips, to read them.
  if (process.env.SHOW) {
    const s = r.report.score;
    if (s) console.log(`    score  ${s.value}${s.next ? ` (fix ${s.next.title} -> ${s.next.to})` : ""} | issues: ${r.report.issues.map((i) => `${i.id}/${i.level}/${i.amount}`).join(", ") || "none"}`);
    for (const i of r.report.info ?? []) console.log(`    info   ${i.title}: ${i.text}${i.rows ? " | " + i.rows.map((x) => `${x.label} ${x.amount}`).join(", ") : ""}`);
    for (const t of r.report.tips ?? []) console.log(`    tip    ${t.title}: ${t.text}`);
  }
}
console.log(`\nFields right: ${fields - wrong}/${fields} (${(((fields - wrong) / fields) * 100).toFixed(1)}%)`);
console.log(`Planted problems found: ${planted - missed}/${planted}`);
console.log(`False alarms: ${extra}`);
console.log(`Cost of this run: $${cost.toFixed(4)}`);
