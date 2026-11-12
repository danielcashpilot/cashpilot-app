import type { Info, Issue, Tip } from "../payslip/rules";
import type { F106Field, Form106 } from "./schema";
import { TAX, taxDue, type TaxCalc } from "./tax";

const v = (f: F106Field) => (f.value === null || Number.isNaN(f.value) ? null : f.value);
const ils = (n: number) => "₪" + Math.round(n).toLocaleString("he-IL");
const sum = (forms: Form106[], k: keyof Form106) => forms.reduce((s, f) => s + (v(f[k] as F106Field) ?? 0), 0);

/** One tax year, made from every 106 form uploaded for it (one per employer). */
export type YearReport = {
  year: number;
  employers: string[];
  months: number | null;
  income: number;
  taxPaid: number;
  calc: TaxCalc | null;
  /** + the tax office owes you, − you may owe tax. null when we can't tell. */
  refund: number | null;
  issues: Issue[];
  ok: string[];
  info: Info[];
  tips: Tip[];
};

export type Report106 = { years: YearReport[]; refund: number };

// A refund can be asked for 6 years back (till the end of the 6th year).
const NOW_YEAR = new Date().getFullYear();
const SMALL = 100; // below this a gap is rounding or something we can't see

function checkYear(year: number, forms: Form106[]): YearReport {
  const issues: Issue[] = [];
  const ok: string[] = [];
  const info: Info[] = [];
  const tips: Tip[] = [];
  const employers = forms.map((f) => f.employer_name ?? "מעסיק").filter((e, i, a) => a.indexOf(e) === i);

  const income = sum(forms, "taxable_income");
  const taxPaid = sum(forms, "income_tax");
  const points = Math.max(0, ...forms.map((f) => v(f.credit_points) ?? 0));
  const pension = sum(forms, "pension_employee");
  const months = forms.every((f) => f.months_worked === null)
    ? null
    : Math.min(12, forms.reduce((s, f) => s + (f.months_worked ?? 0), 0));

  const calc = income > 0 && points > 0
    ? taxDue(year, { income, points, pension, life: sum(forms, "life_insurance"), donations: sum(forms, "donations") })
    : null;
  const refund = calc ? taxPaid - calc.due : null;
  const tooOld = year < NOW_YEAR - 6;

  // 1. The main check: tax paid vs. tax the law asks for.
  if (!TAX[year]) {
    info.push({ id: "no-year", title: "את השנה הזאת עוד לא בודקים", text: `יש לנו את חוקי המס של 2020 עד 2025. את ${year} נבדוק כשהנתונים שלה יהיו סופיים.` });
  } else if (!calc) {
    info.push({ id: "no-calc", title: "חסר מספר כדי לחשב", text: "לא הצלחנו לקרוא מהטופס את ההכנסה או את נקודות הזיכוי, אז לא חישבנו החזר. נסה להעלות קובץ ברור יותר." });
  } else if (refund! >= SMALL) {
    issues.push({
      id: "refund",
      level: tooOld ? "orange" : "red",
      title: `החזר מס ${year}`,
      badge: `${ils(refund!)}`,
      text: `לפי הטופס נוכה ממך מס הכנסה של ${ils(taxPaid)}, אבל לפי החוק המס על ההכנסה שלך הוא ${ils(calc.due)}. ההפרש כנראה מגיע לך בחזרה.` +
        (months !== null && months < 12 ? ` זה קורה הרבה כשעובדים רק ${months} חודשים בשנה: המעסיק מחשב מס כאילו עבדת כל השנה.` : ""),
      amount: refund!,
      once: true,
      todo: tooOld
        ? `עבר זמן: אפשר לבקש החזר רק 6 שנים אחורה, ו-${year} כבר מחוץ לטווח.`
        : "מגישים בקשה להחזר מס (טופס 135) באזור האישי באתר רשות המסים, ומצרפים את טופס 106. אפשר לבקש עד 6 שנים אחורה, וזה בחינם.",
      where: forms[0].income_tax.label ?? undefined,
    });
  } else if (refund! <= -SMALL) {
    issues.push({
      id: "owe",
      level: "orange",
      title: `ייתכן שנוכה פחות מדי מס ב-${year}`,
      badge: `${ils(-refund!)}`,
      text: `לפי החישוב היה צריך לנכות ${ils(calc.due)} מס הכנסה, ונוכו ${ils(taxPaid)}. זה קורה כשעובדים אצל שני מעסיקים בלי תיאום מס.`,
      amount: -refund!,
      once: true,
      todo: "לא חייבים לעשות כלום עכשיו. אם יש לך עוד טופס 106 מאותה שנה, תעלה אותו ונבדוק שוב. אם לא, כדאי לבדוק עם יועץ מס לפני שמגישים בקשה להחזר.",
    });
  } else {
    ok.push(`המס שנוכה ב-${year} מתאים לחישוב`);
  }

  // 2. Facts, no judgement.
  const ni = sum(forms, "national_insurance");
  const health = sum(forms, "health_tax");
  const studyEmp = sum(forms, "study_fund_employee");
  const rows = [
    { label: "מס הכנסה", amount: taxPaid },
    { label: "ביטוח לאומי", amount: ni },
    { label: "מס בריאות", amount: health },
    { label: "פנסיה (נשאר שלך)", amount: pension, mine: true },
    { label: "קרן השתלמות (נשאר שלך)", amount: studyEmp, mine: true },
  ].filter((r) => r.amount > 0);
  if (income > 0) {
    info.push({
      id: "year",
      title: `השנה שלך ב-${year}`,
      text: `הרווחת ${ils(income)} ברוטו` + (months ? ` ב-${months} חודשי עבודה (בערך ${ils(income / months)} בחודש).` : ".") +
        ` ${ils(taxPaid + ni + health)} הלכו למסים ולביטוח לאומי, כלומר ${Math.round(((taxPaid + ni + health) / income) * 100)}% מההכנסה.`,
      rows,
    });
  }
  const employerSaved = sum(forms, "employer_pension_total") + sum(forms, "study_fund_employer");
  if (employerSaved > 0) {
    info.push({
      id: "employer",
      title: "מה המעסיק שם לך בצד השנה",
      text: `${ils(employerSaved)} מעבר למשכורת: ` + (sum(forms, "study_fund_employer") > 0 ? "לפנסיה, לפיצויים ולקרן השתלמות" : "לפנסיה ולפיצויים") + ". הכסף הזה שלך, גם אם לא ראית אותו בחשבון.",
    });
  }
  if (calc) {
    info.push({
      id: "points",
      title: "נקודות הזיכוי שלך",
      text: `בטופס רשומות ${points} נקודות זיכוי. בשנה מלאה הן שוות ${ils(calc.pointsCredit)} הנחה במס.` +
        (calc.grossTax <= calc.pointsCredit ? " ההכנסה שלך השנה לא הגיעה לסכום הזה, אז לפי החוק לא היה צריך לשלם מס הכנסה בכלל." : ""),
    });
  }
  if (employers.length > 1) {
    info.push({ id: "employers", title: `${employers.length} מעסיקים באותה שנה`, text: `חיברנו את הטפסים של ${employers.join(" ו")} לחישוב אחד, כמו שרשות המסים עושה.` });
  }

  // 3. Tips: things that could add to the refund and aren't on the 106.
  if (calc && calc.due > 0) {
    tips.push({ id: "points-more", title: "אולי מגיעות לך עוד נקודות זיכוי", text: "תואר אקדמי, שחרור מצה\"ל או משירות לאומי בשלוש השנים האחרונות, ילדים, או מגורים ביישוב מזכה. כל נקודה שלא נספרה שווה בערך ₪242 בחודש." });
  }
  if (calc && calc.due > 0 && sum(forms, "donations") === 0) {
    tips.push({ id: "donations", title: "תרמת השנה?", text: "קבלות על תרומות (מעל ₪200 בשנה, לעמותה מוכרת) מחזירות 35% מהסכום. מוסיפים אותן לבקשת ההחזר." });
  }
  if (employers.length === 1 && months !== null && months < 12) {
    tips.push({ id: "other-106", title: "עבדת גם במקום אחר באותה שנה?", text: `בטופס הזה רשומים ${months} חודשים. אם עבדת גם אצל מעסיק אחר, תעלה גם את ה-106 שלו: בלי שניהם החישוב לא שלם.` });
  }

  return { year, employers, months, income, taxPaid, calc, refund, issues, ok, info, tips: tips.slice(0, 3) };
}

/** Group the forms by tax year and check each year. */
export function check106(forms: Form106[]): Report106 {
  const byYear = new Map<number, Form106[]>();
  const seen = new Set<string>();
  for (const f of forms) {
    // The same form uploaded twice would double the income.
    const id = `${f.tax_year}|${f.employer_name}|${f.taxable_income.value}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const y = f.tax_year ?? 0;
    byYear.set(y, [...(byYear.get(y) ?? []), f]);
  }
  // Years with money to get back first, then newest first.
  const hasRefund = (y: YearReport) => (y.issues.some((i) => i.id === "refund") ? 1 : 0);
  const years = [...byYear.entries()]
    .map(([y, fs]) => checkYear(y, fs))
    .sort((a, b) => hasRefund(b) - hasRefund(a) || b.year - a.year);
  const refund = years.reduce((s, y) => s + (y.issues.some((i) => i.id === "refund" && i.level === "red") ? y.refund! : 0), 0);
  return { years, refund };
}
