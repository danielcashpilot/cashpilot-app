// 106 accuracy test: like accuracy.mjs, for טופס 106 and the tax refund math.
// Run: npm run dev (in another terminal), then: node scripts/accuracy106.mjs
// Each run spends real API credit (about 1-2 cents per form).
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const API = process.env.API ?? "http://localhost:3000/api/form106";
const SETS = ["test-docs/answers106.json", "test-docs/real/answers106.json"].filter(existsSync);
const TYPES = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };
const same = (got, want) => (want === null ? got == null : got != null && Math.abs(got - want) < 0.015);

async function check(file, key) {
  const body = new FormData();
  body.append("file", new Blob([await readFile(file)], { type: TYPES[path.extname(file).toLowerCase()] }), path.basename(file));
  const res = await fetch(API, { method: "POST", body });
  const json = await res.json();
  if (!res.ok) return { file, error: json.error ?? res.status, cost: json.usage?.cost_usd ?? 0 };
  const form = json.forms[0];
  const wrong = [];
  let fields = 0;
  for (const [name, want] of Object.entries(key.fields)) {
    fields++;
    const got = form[name] !== null && typeof form[name] === "object" ? form[name].value : form[name];
    if (!same(got, want)) wrong.push(`${name}: got ${got}, want ${want}`);
  }
  const y = json.report.years[0];
  const got = Object.fromEntries(y.issues.map((i) => [i.id, i.level]));
  const missed = Object.entries(key.issues).filter(([id, l]) => got[id] !== l).map(([id, l]) => `${id} (${l})`);
  const extra = Object.keys(got).filter((id) => !(id in key.issues)).map((id) => `${id} (${got[id]})`);
  if (Math.abs((y.refund ?? 0) - key.refund) > 1) wrong.push(`refund: got ${y.refund}, want ${key.refund}`);
  return { file, fields, wrong, missed, extra, planted: Object.keys(key.issues).length, cost: json.usage.cost_usd, y };
}

const jobs = [];
for (const set of SETS) {
  const keys = JSON.parse(await readFile(set, "utf8"));
  for (const [name, key] of Object.entries(keys)) if (!name.startsWith("_")) jobs.push(check(path.join(path.dirname(set), name), key));
}
let fields = 0, wrong = 0, planted = 0, missed = 0, extra = 0, cost = 0;
for (const r of await Promise.all(jobs)) {
  cost += r.cost;
  if (r.error) { console.log(`✗ ${r.file}: ${r.error}`); continue; }
  fields += r.fields; wrong += r.wrong.length; planted += r.planted; missed += r.missed.length; extra += r.extra.length;
  const bad = r.wrong.length || r.missed.length || r.extra.length;
  console.log(`${bad ? "✗" : "✓"} ${r.file}  fields ${r.fields - r.wrong.length}/${r.fields}  refund ${Math.round(r.y.refund ?? 0)}  $${r.cost.toFixed(4)}`);
  for (const w of r.wrong) console.log(`    wrong  ${w}`);
  for (const m of r.missed) console.log(`    missed ${m}`);
  for (const e of r.extra) console.log(`    extra  ${e}`);
}
console.log(`\nFields right: ${fields - wrong}/${fields}\nPlanted problems found: ${planted - missed}/${planted}\nFalse alarms: ${extra}\nCost: $${cost.toFixed(4)}`);
