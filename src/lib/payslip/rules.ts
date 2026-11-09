import type { Payslip, PField } from "./schema";

// Israeli numbers used by the checks. Check them every April and January.
export const LAW_2026 = {
  minWageMonthly: 6443.85, // full time, age 18+, from 2026-04-01 (ביטוח לאומי / כל זכות)
  minWageHourly: 35.4, // 182-hour basis
  creditPointValue: 242, // ₪ per point per month, 2026
  basePoints: 2.25, // every resident
  employerPensionPct: 6.5,
  employerSeverancePct: 6,
};

export type Issue = {
  id: string;
  level: "red" | "orange";
  title: string;
  badge: string;
  text: string;
  /** ₪ per month we believe is missing (red) or could be gained (orange). */
  amount: number;
  /** Shown as "המספר מהתלוש: ₪X · לא נכון?" only when the code is not sure. */
  quiet?: { value: number; label: string | null };
  where?: string;
};

export type Report = {
  employer: string | null;
  month: string | null;
  gross: number | null;
  net: number | null;
  issues: Issue[];
  ok: string[];
  /** Sum of red amounts: money the employer owes this month. */
  owed: number;
};

const v = (f: PField) => (f.value === null || Number.isNaN(f.value) ? null : f.value);
const where = (f: PField) => (f.label ? `"${f.label}"${f.page ? `, עמוד ${f.page}` : ""}` : undefined);
const ils = (n: number) => "₪" + Math.round(n).toLocaleString("he-IL");
const round = (n: number) => Math.round(n);

export function checkPayslip(p: Payslip): Report {
  const issues: Issue[] = [];
  const ok: string[] = [];
  const gross = v(p.gross_total);
  const net = v(p.net_pay);

  // 1. Math: gross − deductions = net.
  const ded = v(p.deductions_total);
  if (gross !== null && net !== null && ded !== null) {
    const gap = gross - ded - net;
    if (Math.abs(gap) <= 2) ok.push("החשבון בתלוש מסתדר");
    else
      issues.push({
        id: "math",
        level: "orange",
        title: "החשבון בתלוש לא מסתדר",
        badge: "שווה לבדוק",
        text: `ברוטו פחות ניכויים יוצא ${ils(gross - ded)}, אבל בבנק אמורים להיכנס ${ils(net)}. לפעמים זה בגלל הטבות שנרשמות בברוטו (כמו רכב או ארוחות), ולפעמים זו טעות.`,
        amount: 0,
      });
  }

  // 2. Hourly rate, used by minimum wage and overtime.
  const base = v(p.base_salary);
  const regHours = v(p.regular_hours);
  const rate = v(p.hourly_rate) ?? (base !== null && regHours ? base / regHours : null);

  // 3. Minimum wage.
  const jobPct = v(p.job_percent);
  if (rate !== null) {
    if (rate < LAW_2026.minWageHourly - 0.05) {
      const missing = (LAW_2026.minWageHourly - rate) * (regHours ?? 182);
      issues.push({
        id: "minwage",
        level: "red",
        title: "שכר מינימום",
        badge: `חסרים ${ils(missing)}`,
        text: `שילמו לך ${rate.toFixed(2)} ₪ לשעה. שכר המינימום מאפריל 2026 הוא ${LAW_2026.minWageHourly} ₪ לשעה.`,
        amount: round(missing),
        quiet: p.hourly_rate.value === null && base !== null ? { value: base, label: p.base_salary.label } : undefined,
        where: where(p.hourly_rate) ?? where(p.base_salary),
      });
    } else ok.push("שכר מינימום");
  } else if (jobPct === 100 && base !== null) {
    if (base < LAW_2026.minWageMonthly - 1) {
      const missing = LAW_2026.minWageMonthly - base;
      issues.push({
        id: "minwage",
        level: "red",
        title: "שכר מינימום",
        badge: `חסרים ${ils(missing)}`,
        text: `שכר היסוד למשרה מלאה הוא ${ils(base)}. שכר המינימום מאפריל 2026 הוא ${ils(LAW_2026.minWageMonthly)}.`,
        amount: round(missing),
        where: where(p.base_salary),
      });
    } else ok.push("שכר מינימום");
  }

  // 4. Overtime: at least 125% for the first hours, 150% after.
  const h125 = v(p.overtime_125_hours) ?? 0;
  const h150 = v(p.overtime_150_hours) ?? 0;
  const hAll = v(p.overtime_total_hours) ?? 0;
  const otPay = v(p.overtime_pay);
  const otHours = h125 + h150 || hAll;
  if (otHours > 0 && rate !== null && otPay !== null) {
    // Without a split we assume the cheapest legal case (all at 125%).
    const minPay = h125 + h150 > 0 ? (h125 * 1.25 + h150 * 1.5) * rate : hAll * 1.25 * rate;
    if (otPay < minPay - 2) {
      const missing = minPay - otPay;
      issues.push({
        id: "overtime",
        level: "red",
        title: "שעות נוספות",
        badge: `חסרים ${ils(missing)}`,
        text: `על ${otHours} שעות נוספות שילמו ${ils(otPay)}. לפי החוק מגיע לפחות ${ils(minPay)}: השעתיים הראשונות ביום ב-125% לפחות, ואחריהן 150%.`,
        amount: round(missing),
        quiet: p.hourly_rate.value === null ? { value: otPay, label: p.overtime_pay.label } : undefined,
        where: where(p.overtime_pay),
      });
    } else ok.push("שעות נוספות");
  }

  // 5. Pension: employer 6.5% + severance 6% of the pension salary.
  const pensionBase = v(p.pension_salary) ?? base ?? gross;
  const baseIsSure = v(p.pension_salary) !== null;
  const employer = v(p.pension_employer);
  const severance = v(p.severance_employer);
  if (pensionBase !== null) {
    if (employer === null && severance === null) {
      issues.push({
        id: "pension-none",
        level: "orange",
        title: "הפקדה לפנסיה",
        badge: "שווה לבדוק",
        text: "לא מצאנו בתלוש הפקדה של המעסיק לפנסיה. בחצי השנה הראשונה בעבודה זה יכול להיות תקין, ואחרי זה המעסיק חייב להפקיד.",
        amount: 0,
      });
    } else {
      let pensionOk = true;
      if (employer !== null) {
        const expected = (pensionBase * LAW_2026.employerPensionPct) / 100;
        const missing = expected - employer;
        if (missing > 5 && missing / expected > 0.02) {
          pensionOk = false;
          const pct = ((employer / pensionBase) * 100).toFixed(1).replace(/\.0$/, "");
          issues.push({
            id: "pension",
            level: "red",
            title: "הפקדה לפנסיה",
            badge: `חסרים ${ils(missing)}`,
            text: `המעסיק הפקיד ${pct}% (${ils(employer)}) במקום ${LAW_2026.employerPensionPct}% מהשכר. זה קורה הרבה, ובדרך כלל מתקנים אחרי פנייה אחת.`,
            amount: round(missing),
            quiet: baseIsSure ? undefined : { value: employer, label: p.pension_employer.label },
            where: where(p.pension_employer),
          });
        }
      }
      if (severance !== null) {
        const expected = (pensionBase * LAW_2026.employerSeverancePct) / 100;
        const missing = expected - severance;
        if (missing > 5 && missing / expected > 0.02) {
          pensionOk = false;
          issues.push({
            id: "severance",
            level: "red",
            title: "הפקדה לפיצויים",
            badge: `חסרים ${ils(missing)}`,
            text: `המעסיק הפקיד לפיצויים ${ils(severance)}. לפי החוק מגיע לפחות ${LAW_2026.employerSeverancePct}% מהשכר, כלומר ${ils(expected)}.`,
            amount: round(missing),
            quiet: baseIsSure ? undefined : { value: severance, label: p.severance_employer.label },
            where: where(p.severance_employer),
          });
        }
      }
      if (pensionOk) ok.push("הפקדות לפנסיה");
    }
  }

  // 6. Tax credit points.
  const points = v(p.tax_credit_points);
  if (points !== null) {
    if (points <= LAW_2026.basePoints) {
      issues.push({
        id: "points",
        level: "orange",
        title: "נקודות זיכוי",
        badge: "שווה לבדוק",
        text: `רשומות לך ${points}. אישה, הורה, חייל משוחרר או מי שסיים תואר בשנים האחרונות מקבלים יותר. כל נקודה שווה ${ils(LAW_2026.creditPointValue)} בחודש.`,
        amount: LAW_2026.creditPointValue,
        where: where(p.tax_credit_points),
      });
    } else ok.push("נקודות זיכוי");
  }

  // 7. Study fund (קרן השתלמות): not required by law, so only "worth checking".
  const sfEmployer = v(p.study_fund_employer);
  if (!sfEmployer) {
    issues.push({
      id: "study-fund",
      level: "orange",
      title: "קרן השתלמות",
      badge: "שווה לבדוק",
      text: "לא מופיעה בתלוש. היא לא חובה לפי החוק, אבל אם הובטחה לך בחוזה או בהסכם, המעסיק צריך להפקיד אותה כל חודש.",
      amount: 0,
    });
  } else ok.push("קרן השתלמות");

  if (v(p.havraah_pay)) ok.push("דמי הבראה שולמו החודש");

  // Problems first, then by money.
  issues.sort((a, b) => (a.level === b.level ? b.amount - a.amount : a.level === "red" ? -1 : 1));

  return {
    employer: p.employer_name,
    month: p.month,
    gross,
    net,
    issues,
    ok,
    owed: issues.filter((i) => i.level === "red").reduce((s, i) => s + i.amount, 0),
  };
}
