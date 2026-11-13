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
  /** The tax paid matches the calculation (no refund, nothing owed). */
  taxOk: boolean;
  ok: string[];
  info: Info[];
  tips: Tip[];
};

/** refund: sure refunds (green). maybe: refunds that depend on something we can't see (orange, "up to"). */
export type Report106 = { years: YearReport[]; refund: number; maybe: number };

// A refund can be asked for 6 years back (till the end of the 6th year).
const NOW_YEAR = new Date().getFullYear();
const OTHER = "עבודה אחרת, דמי אבטלה, דמי לידה או מילואים";
const SMALL = 100; // below this a gap is rounding or something we can't see
// Minimum deposits by law (צו ההרחבה לפנסיה חובה), percent of the insured salary.
const MIN = { employer: 6.5, severance: 6, employee: 6 };
const pct = (n: number) => `${Number(n.toFixed(2))}%`;

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
  const studyEmp = sum(forms, "study_fund_employee");
  // Pension is figured on the insured salary; without it printed, use the income.
  const insured = forms.reduce((s, f) => s + (v(f.insured_income) ?? v(f.taxable_income) ?? 0), 0);
  const months = forms.every((f) => f.months_worked === null)
    ? null
    : Math.min(12, forms.reduce((s, f) => s + (f.months_worked ?? 0), 0));

  const calc = income > 0 && points > 0
    ? taxDue(year, { income, insured, points, pension, life: sum(forms, "life_insurance"), donations: sum(forms, "donations") })
    : null;
  const refund = calc ? taxPaid - calc.due : null;
  const t = TAX[year];
  // Points that changed during the year: the shekels credited don't match
  // points × monthly value × months. Then the full-year points are less sure.
  const pointsValue = sum(forms, "credit_points_value");
  const expectedValue = t && months ? points * (t.point / 12) * months : 0;
  const pointsChanged = pointsValue > 0 && expectedValue > 0 && Math.abs(pointsValue / expectedValue - 1) > 0.05;
  // The credit payroll already gave (shekels) is surely owed; if it covers the tax,
  // the result doesn't depend on how many points there are for the whole year.
  const covered = !!calc && pointsValue > 0 && pointsValue + calc.pensionCredit + calc.otherCredit >= calc.grossTax;
  // Points needed for the tax to come out 0 (the full refund).
  const breakEven = calc && t ? Math.max(0, (calc.grossTax - calc.pensionCredit - calc.otherCredit) / t.point) : null;
  // The refund if only the basic points apply (2.25 every resident, 2.75 women).
  const refundAt = (p: number) =>
    calc && t ? Math.max(0, taxPaid - Math.max(0, calc.grossTax - p * t.point - calc.pensionCredit - calc.otherCredit)) : 0;
  const floorText = (p: number, who: string) => {
    const r = refundAt(p);
    const debt = calc && t ? Math.max(0, calc.grossTax - p * t.point - calc.pensionCredit - calc.otherCredit) - taxPaid : 0;
    if (debt >= SMALL) return `עם ${p} נקודות (${who}) לא יגיע החזר, ואפילו ייתכן חוב של בערך ${ils(debt)}`;
    return r < SMALL ? `עם ${p} נקודות (${who}) לא יגיע החזר` : `עם ${p} נקודות (${who}) ההחזר יהיה בערך ${ils(r)}`;
  };
  const tooOld = year < NOW_YEAR - 6;
  // Names of the months not worked (one form only), e.g. "ינואר–אפריל".
  const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  const wm = forms.length === 1 ? forms[0].worked_months : null;
  const off = wm && wm.length > 0 && wm.length < 12 ? [...Array(12).keys()].map((i) => i + 1).filter((m) => !wm.includes(m)) : [];
  const runs: string[] = [];
  for (let i = 0; i < off.length; i++) {
    let j = i;
    while (j + 1 < off.length && off[j + 1] === off[j] + 1) j++;
    runs.push(i === j ? MONTHS[off[i] - 1] : `${MONTHS[off[i] - 1]}–${MONTHS[off[j] - 1]}`);
    i = j;
  }
  const missing = runs.join(", ");
  let taxOk = false;

  // 1. The main check: tax paid vs. tax the law asks for.
  if (!TAX[year]) {
    info.push({ id: "no-year", title: "את השנה הזאת עוד לא בודקים", text: `יש לנו את חוקי המס של 2020 עד 2025. את ${year} נבדוק כשהנתונים שלה יהיו סופיים.` });
  } else if (!calc) {
    info.push({ id: "no-calc", title: "חסר מספר כדי לחשב", text: "לא הצלחנו לקרוא מהטופס את ההכנסה או את נקודות הזיכוי, אז לא חישבנו החזר. נסה להעלות קובץ ברור יותר." });
  } else if (refund! >= SMALL) {
    const unsure = pointsChanged && !covered && breakEven !== null && breakEven > 2.25;
    issues.push({
      id: "refund",
      level: tooOld || unsure ? "orange" : "red",
      good: !tooOld && !unsure,
      title: `החזר מס ${year}`,
      badge: unsure ? `עד ${ils(refund!)}` : `${ils(refund!)}`,
      text: `נוכה ממך מס הכנסה של ${ils(taxPaid)}. לפי החישוב שלנו, לפי הטופס בלבד, המס על ההכנסה שלך יוצא ${ils(calc.due)}, אז ההפרש כנראה מגיע לך בחזרה.` +
        (unsure ? " הסכום תלוי בכמה נקודות זיכוי מגיעות לך, ולכן הוא \"עד\"." : ""),
      more: [
        ...(months !== null && months < 12
          ? [
              covered
                ? `למה: עבדת רק ${months} חודשים. המעסיק חישב מס לפי מדרגות חודשיות על החודשים שעבדת, ובחישוב השנתי המדרגות פרוסות על כל השנה, אז המס יוצא נמוך יותר.`
                : `למה: עבדת רק ${months} חודשים. המעסיק נתן לך מדרגות מס ונקודות זיכוי רק על החודשים שעבדת, ובחישוב השנתי רוב הנקודות מגיעות לך על כל השנה.`,
              ...(covered
                ? ["ההחזר לא תלוי בנקודות נוספות: הנקודות שהמעסיק כבר נתן לך מכסות את כל המס של השנה."]
                : []),
              `זה נכון רק אם ${missing ? `ב${missing}` : "בשאר החודשים"} לא הייתה לך הכנסה אחרת (${OTHER}). תשלומים מביטוח לאומי יכולים להקטין את ההחזר, להגדיל אותו (אם נוכה מהם מס) או אפילו ליצור חוב. אם היו כאלה, כדאי להוריד מאתר ביטוח לאומי אישור שנתי על ניכוי מס ולצרף אותו.`,
            ]
          : []),
        ...(unsure
          ? [
              `נראה שבחלק מהחודשים קיבלת פחות נקודות זיכוי. ההחזר המלא נכון רק אם מגיעות לך לפחות ${Number(breakEven!.toFixed(2))} נקודות בכל השנה.`,
              `לכל תושב יש לפחות 2.25 נקודות ולאישה 2.75, ויש עוד על ילדים, תואר או שחרור מצה"ל. ${floorText(2.25, "בסיס")}; ${floorText(2.75, "בסיס לאישה")}.`,
            ]
          : []),
      ],
      amount: refund!,
      once: true,
      todo: tooOld
        ? `עבר זמן: אפשר לבקש החזר רק 6 שנים אחורה, ו-${year} כבר מחוץ לטווח.`
        : "מגישים בקשה להחזר מס (טופס 135) באזור האישי באתר רשות המסים, ומצרפים את טופס 106. אפשר לבקש עד 6 שנים אחורה, וזה בחינם. ההחזר משולם עם הצמדה וריבית.",
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
      todo: "לא חייבים לעשות כלום עכשיו. אם יש לך עוד טופס 106 מאותה שנה, כדאי להעלות אותו ונבדוק שוב. אם לא, כדאי לבדוק עם יועץ מס לפני שמגישים בקשה להחזר.",
    });
  } else {
    taxOk = true;
  }

  // 1b. Pension deposit rates, from each form's funds table.
  for (const f of forms) {
    const base = v(f.fund_base) ?? v(f.insured_income);
    if (!base || base <= 0) continue;
    const who = forms.length > 1 ? ` (${f.employer_name ?? "מעסיק"})` : "";
    const rate = (x: number | null) => (x === null ? null : (x / base) * 100);
    const checks: [string, number | null, number, string][] = [
      ["pension-employer", rate(v(f.pension_employer)), MIN.employer, "הפקדת המעסיק לפנסיה"],
      ["severance", rate(v(f.severance_employer)), MIN.severance, "הפקדת המעסיק לפיצויים"],
      ["pension-employee", rate(v(f.pension_employee)), MIN.employee, "ההפקדה שלך לפנסיה"],
    ];
    for (const [id, r, min, name] of checks) {
      if (r === null) continue;
      if (r >= min - 0.05) ok.push(`${name}: ${pct(r)}${r > min + 0.5 ? ` (מעל המינימום של ${min}%${id === "severance" && r >= 8.3 ? ", פיצויים מלאים" : ""})` : " (המינימום בחוק)"}${who}`);
      else
        issues.push({
          id,
          level: "orange",
          title: name + who,
          badge: `${pct(r)} במקום ${min}%`,
          text: `לפי טבלת הקופות בטופס, ${name} השנה היא ${pct(r)} מ-${ils(base)}. החוק דורש לפחות ${min}%. יש הסדרים ישנים שמותר בהם פחות, אז שווה לבדוק.`,
          amount: ((min - r) / 100) * base,
          once: true,
          todo: "כדאי לשאול את מחלקת השכר למה האחוז נמוך. אם אין הסדר מיוחד, המעסיק צריך להשלים את ההפרש.",
        });
    }
  }

  // 2. Facts, no judgement.
  const ni = sum(forms, "national_insurance");
  const health = sum(forms, "health_tax");
  const rows = [
    { label: "מס הכנסה", amount: taxPaid },
    { label: "ביטוח לאומי", amount: ni },
    { label: "מס בריאות", amount: health },
    { label: "פנסיה (נשאר שלך)", amount: pension, mine: true },
    { label: "קרן השתלמות (נשאר שלך)", amount: studyEmp, mine: true },
  ].filter((r) => r.amount > 0);
  const overtime = sum(forms, "overtime_special");
  const expenses = sum(forms, "expenses_cover");
  const regular = income - overtime - expenses;
  // Part of the insured-salary gap the form doesn't explain (not overtime, not expenses).
  const unexplained = overtime + expenses > 0 ? income - insured - overtime - expenses : 0;
  if (income > 0) {
    const split = overtime > 0 || expenses > 0;
    info.push({
      id: "year",
      title: `השנה שלך ב-${year}`,
      text: `ההכנסה החייבת במס שלך (ברוטו) הייתה ${ils(income)}` + (months ? ` ב-${months} חודשי עבודה` : "") +
        (split
          ? `: ${ils(regular)} משכורת רגילה${unexplained > 300 ? " ותשלומים אחרים" : ""}` + (overtime > 0 ? `, ${ils(overtime)} שעות נוספות ושכר מיוחד` : "") + (expenses > 0 ? `, ${ils(expenses)} החזר הוצאות (לא משכורת, אבל גם הוא נכלל בהכנסה החייבת במס)` : "") + "."
          : ".") +
        (months ? (split ? ` ${unexplained > 300 ? "המשכורת הרגילה והתשלומים האחרים יצאו" : "המשכורת הרגילה יצאה"} בערך ${ils(regular / months)} בחודש.` : ` בערך ${ils(income / months)} בחודש.`) : "") +
        ` ${ils(taxPaid + ni + health)} הלכו למסים ולביטוח לאומי, כלומר ${Math.round(((taxPaid + ni + health) / income) * 100)}% מההכנסה` +
        (refund !== null && refund >= SMALL ? " (ייתכן שחלק ממס ההכנסה יחזור; ביטוח לאומי ומס בריאות לא חוזרים)." : "."),
      rows,
    });
  }
  const employerSaved = sum(forms, "employer_pension_total") + sum(forms, "study_fund_employer");
  if (employerSaved > 0) {
    info.push({
      id: "employer",
      title: "מה המעסיק שם לך בצד השנה",
      text: `${ils(employerSaved)} מעבר למשכורת: ` + (sum(forms, "study_fund_employer") > 0 ? "לפנסיה, לפיצויים ולקרן השתלמות" : "לפנסיה ולפיצויים") +
        ". הכסף לפנסיה" + (sum(forms, "study_fund_employer") > 0 ? " ולקרן ההשתלמות" : "") + " שלך, גם אם לא ראית אותו בחשבון" +
        (sum(forms, "study_fund_employer") > 0 ? " (הפנסיה נשמרת לפרישה; קרן ההשתלמות פתוחה למשיכה אחרי 6 שנים)." : " (הוא נשמר לפרישה).") +
        " כספי הפיצויים שלך בוודאות רק אם יש לך הסדר סעיף 14 (אפשר לשאול את מחלקת השכר); בלי הסדר כזה, הם תלויים באיך שהעבודה נגמרת.",
    });
  }
  if (insured > 0 && insured < income * 0.97) {
    info.push({
      id: "insured",
      title: "על כמה כסף מפקידים לך",
      text: `ההפקדות לפנסיה${studyEmp > 0 ? " ולקרן ההשתלמות" : ""} חושבו על ${ils(insured)} ולא על כל ${ils(income)}. ${unexplained > 300 ? "רוב זה תקין" : "זה תקין"}: לא מפקידים על ` +
        (overtime > 0 || expenses > 0
          ? [overtime > 0 && `שעות נוספות ושכר מיוחד (${ils(overtime)})`, expenses > 0 && `כיסוי הוצאות (${ils(expenses)})`].filter(Boolean).join(" ועל ")
          : "שעות נוספות, החזר הוצאות ותוספות מיוחדות") +
        `. על ההפרש (${ils(income - insured)}) לא נחסך לך כסף לפנסיה.` +
        (overtime + expenses > 0 && unexplained > 300
          ? ` ${ils(overtime + expenses)} מההפרש מוסברים בטופס; עוד בערך ${ils(unexplained)} לא מפורטים בו (אולי מתנות, פדיון חופשה או הטבות). אפשר לשאול את מחלקת השכר.`
          : ""),
    });
  }
  if (calc) {
    info.push({
      id: "points",
      title: "נקודות הזיכוי שלך",
      text: `בטופס רשומות ${points} נקודות זיכוי (כל תושב מקבל 2.25, אישה עוד 0.5, והשאר בדרך כלל על ילדים, תואר או שחרור מצה"ל). אם כל הנקודות מגיעות לך על כל השנה, הן שוות ${ils(calc.pointsCredit)} הנחה במס.` +

        (calc.grossTax <= calc.pointsCredit
          ? ` המס על ההכנסה שלך השנה, לפני ההנחה, יוצא ${ils(calc.grossTax)}: פחות מההנחה.` +
            (covered ? ` גם הנקודות שהמעסיק כבר נתן לך (${ils(pointsValue)}) מספיקות לזה.` : " זה נכון אם הנקודות מגיעות לך כל השנה.") +
            ` לכן, לפי הטופס בלבד` + (months !== null && months < 12 ? " ובתנאי שבחודשים שלא עבדת לא הייתה לך הכנסה אחרת" : "") + `, כנראה לא היה צריך לשלם מס הכנסה בכלל.`
          : ""),
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
    tips.push({
      id: "other-106",
      title: "עבדת גם במקום אחר באותה שנה?",
      text: `בטופס הזה רשומים ${months} חודשים` + (forms[0].single_job ? " ומשרה יחידה" : "") +
        (missing ? ` (לא עבדת כאן ב${missing})` : "") + `. אם בחודשים האחרים עבדת אצל מעסיק אחר, כדאי להעלות גם את ה-106 שלו. אם קיבלת מביטוח לאומי דמי אבטלה, דמי לידה או מילואים, גם הם נספרים בחישוב השנתי: הם יכולים להקטין את ההחזר, להגדיל אותו או ליצור חוב. את האישור השנתי על ניכוי מס מורידים מאתר ביטוח לאומי.`,
    });
  }

  return { year, employers, months, income, taxPaid, calc, refund, issues, taxOk, ok, info, tips: tips.slice(0, 3) };
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
  const total = (level: string) =>
    years.reduce((s, y) => s + (y.issues.some((i) => i.id === "refund" && i.level === level) ? y.refund! : 0), 0);
  return { years, refund: total("red"), maybe: total("orange") };
}
