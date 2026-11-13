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
  /** "מה עושים": one short next step. */
  todo?: string;
  /** The amount is a one-time sum (e.g. a tax refund), not per month. */
  once?: boolean;
  /** Details behind "למה ומה עוד חשוב לדעת", closed by default. */
  more?: string[];
  /** Good news (e.g. a tax refund): shown green instead of red. */
  good?: boolean;
};

/** Gray "good to know" card: facts about this payslip, no judgement. */
export type Info = { id: string; title: string; text: string; rows?: { label: string; amount: number; mine?: boolean }[] };
/** Yellow tip, always about something printed on this payslip. */
export type Tip = { id: string; title: string; text: string };

export type Report = {
  employer: string | null;
  month: string | null;
  gross: number | null;
  net: number | null;
  issues: Issue[];
  ok: string[];
  /** Sum of red amounts: money the employer owes this month. */
  owed: number;
  info?: Info[];
  tips?: Tip[];
  /** 0-100, how correct the payslip is (the employer's work, not the user). */
  score?: Score;
};

export type Score = { value: number; next?: { title: string; to: number } };

/** What each problem costs the score: red by the money missing, orange a little. */
const penalty = (i: Issue) => (i.level === "red" ? 10 + Math.min(15, i.amount / 25) : 5);

export function scoreOf(issues: Issue[]): Score {
  const value = Math.max(0, Math.round(100 - issues.reduce((s, i) => s + penalty(i), 0)));
  if (!issues.length) return { value };
  const worst = issues.reduce((a, b) => (penalty(b) > penalty(a) ? b : a));
  return { value, next: { title: worst.title, to: Math.min(100, Math.round(value + penalty(worst))) } };
}

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
        todo: "שואלים את מי שמכין את התלושים ממה נובע ההפרש.",
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
        todo: "פונים למעסיק או למי שמכין את התלושים ומבקשים לתקן ולשלם את ההפרש. אפשר להראות לו את הבדיקה הזאת.",
        badge: `חסרים ${ils(missing)}`,
        text: `שילמו לך ${rate.toFixed(2)} ₪ לשעה. שכר המינימום מאפריל 2026 הוא ${LAW_2026.minWageHourly.toFixed(2)} ₪ לשעה.`,
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
        todo: "פונים למעסיק או למי שמכין את התלושים ומבקשים לתקן ולשלם את ההפרש. אפשר להראות לו את הבדיקה הזאת.",
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
        todo: "פונים למעסיק או למי שמכין את התלושים ומבקשים לתקן ולשלם את ההפרש. אפשר להראות לו את הבדיקה הזאת.",
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
        todo: "אם אתה עובד שם יותר מחצי שנה (או יותר מ-3 חודשים והייתה לך קרן פנסיה קודם), שאל את המעסיק לאיזו קרן הוא מפקיד.",
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
            todo: "מבקשים מהמעסיק לתקן את ההפקדה ולהשלים את מה שחסר. בדוח מקרן הפנסיה רואים כמה הגיע בפועל.",
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
            todo: "מבקשים מהמעסיק לתקן את ההפקדה ולהשלים את מה שחסר. בדוח מקרן הפנסיה רואים כמה הגיע בפועל.",
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
        todo: "אם מגיעות לך עוד נקודות, ממלאים טופס 101 חדש אצל המעסיק. על שנים קודמות אפשר לבקש החזר מס, עד 6 שנים אחורה.",
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
      todo: "בודקים מה כתוב בחוזה העבודה, או שואלים את המעסיק אם יש הסכם שמחייב קרן השתלמות.",
      badge: "שווה לבדוק",
      text: "לא מופיעה בתלוש. היא לא חובה לפי החוק, אבל אם הובטחה לך בחוזה או בהסכם, המעסיק צריך להפקיד אותה כל חודש.",
      amount: 0,
    });
  } else ok.push("קרן השתלמות");

  if (v(p.havraah_pay)) ok.push("דמי הבראה שולמו החודש");

  // Problems first, then by money.
  issues.sort((a, b) => (a.level === b.level ? b.amount - a.amount : a.level === "red" ? -1 : 1));

  const { info, tips } = explain(p, issues);

  return {
    employer: p.employer_name,
    month: p.month,
    gross,
    net,
    issues,
    ok,
    owed: issues.filter((i) => i.level === "red").reduce((s, i) => s + i.amount, 0),
    info,
    tips,
    score: scoreOf(issues),
  };
}

/** Facts (gray) and tips (yellow) about this payslip. Only numbers printed on it; never advice on where to move money. */
function explain(p: Payslip, issues: Issue[]): { info: Info[]; tips: Tip[] } {
  const info: Info[] = [];
  const tips: Tip[] = [];
  const has = (id: string) => issues.some((i) => i.id.startsWith(id));
  const gross = v(p.gross_total);
  const net = v(p.net_pay);

  // 1. Where the money went: gross to net.
  const rows = [
    { label: "פנסיה (נשאר שלך)", amount: v(p.pension_employee) ?? 0, mine: true },
    { label: "קרן השתלמות (נשאר שלך)", amount: v(p.study_fund_employee) ?? 0, mine: true },
    { label: "מס הכנסה", amount: v(p.income_tax) ?? 0 },
    { label: "ביטוח לאומי", amount: v(p.national_insurance) ?? 0 },
    { label: "מס בריאות", amount: v(p.health_tax) ?? 0 },
  ].filter((r) => r.amount > 0);
  if (gross !== null && net !== null && rows.length >= 2) {
    const mine = rows.filter((r) => r.mine).reduce((s, r) => s + r.amount, 0);
    // Whatever the listed lines don't cover (meals, union fees, loans...).
    const rest = gross - net - rows.reduce((s, r) => s + r.amount, 0);
    rows.sort((a, b) => b.amount - a.amount);
    if (rest > 5) rows.push({ label: "ניכויים אחרים", amount: rest, mine: false });
    info.push({
      id: "where",
      title: "לאן הלך הכסף",
      text: `מתוך ${ils(gross)} ברוטו נכנסו לך לחשבון ${ils(net)}.` + (mine > 0 ? ` ${ils(mine)} מההפרש לא הלכו לאיבוד: הם נחסכים בשבילך.` : ""),
      rows,
    });
  }

  // 1b. What one hour of work brought in (only when the hours are printed).
  const regHours = v(p.regular_hours);
  const otHoursAll = (v(p.overtime_125_hours) ?? 0) + (v(p.overtime_150_hours) ?? 0) || (v(p.overtime_total_hours) ?? 0);
  if (net !== null && gross !== null && regHours && regHours >= 20) {
    const hoursAll = regHours + otHoursAll;
    info.push({
      id: "hour",
      title: "השעה שלך שווה",
      text: `עבדת החודש ${Number(hoursAll.toFixed(2))} שעות. כל שעה הכניסה לך בערך ${ils(net / hoursAll)} נטו לחשבון (${ils(gross / hoursAll)} ברוטו).`,
    });
  }

  // 2. What the employer puts aside for you.
  const pe = v(p.pension_employer) ?? 0;
  const se = v(p.severance_employer) ?? 0;
  const sf = v(p.study_fund_employer) ?? 0;
  const saved = pe + se + sf;
  if (saved > 0) {
    const parts = [pe && "פנסיה", se && "פיצויים", sf && "קרן השתלמות"].filter(Boolean) as string[];
    const list = parts.length > 1 ? parts.slice(0, -1).join(", ") + " ול" + parts[parts.length - 1] : parts[0];
    info.push({
      id: "employer",
      title: "מה המעסיק שם לך בצד",
      text: `חוץ מהמשכורת, המעסיק מפקיד לך החודש ${ils(saved)} ל${list}. זה בערך ${ils(Math.round((saved * 12) / 100) * 100)} בשנה, והכסף הזה שלך.`,
    });
  }

  // 3. דמי הבראה this month.
  const havraah = v(p.havraah_pay);
  if (havraah) {
    info.push({
      id: "havraah",
      title: "דמי הבראה",
      text: `קיבלת החודש ${ils(havraah)} דמי הבראה. בהרבה מקומות עבודה משלמים אותם פעם בשנה, ואז הנטו של החודש הזה גבוה מהרגיל.`,
    });
  }

  // 4. Overtime this month.
  const otPay = v(p.overtime_pay);
  const otHours = (v(p.overtime_125_hours) ?? 0) + (v(p.overtime_150_hours) ?? 0) || (v(p.overtime_total_hours) ?? 0);
  const hours = Number(otHours.toFixed(2));
  if (otPay && otHours) {
    info.push({
      id: "overtime",
      title: "שעות נוספות",
      text: `שולמו לך ${hours} שעות נוספות, ${ils(otPay)}.${gross !== null ? ` בלעדיהן הברוטו היה ${ils(gross - otPay)}.` : ""}`,
    });
  }

  // Tips, most money first. A subject already shown as a problem gets no tip.
  const deposited = (v(p.pension_employee) ?? 0) + pe + se;
  if (deposited > 0 && !has("pension") && !has("severance")) {
    tips.push({
      id: "pension-arrived",
      title: "תוודא שהכסף הגיע לפנסיה",
      text: `לפי התלוש הופקדו לפנסיה החודש ${ils(deposited)}. באזור האישי באתר של קרן הפנסיה, או בדוח שהיא שולחת, אפשר לראות אם הכסף באמת הגיע.`,
    });
  }
  const points = v(p.tax_credit_points);
  if (points !== null && !has("points")) {
    tips.push({
      id: "points-101",
      title: "כשמשהו משתנה, מעדכנים את המעסיק",
      text: `רשומות לך ${points} נקודות זיכוי. כשנולד ילד, כשמסיימים תואר או כשמשתחררים מהצבא, ממלאים טופס 101 חדש. כל נקודה שווה ${ils(LAW_2026.creditPointValue)} בחודש.`,
    });
  }
  const sfTotal = (v(p.study_fund_employee) ?? 0) + sf;
  if (sfTotal > 0) {
    tips.push({
      id: "study-fund-6y",
      title: "קרן ההשתלמות שלך",
      text: `נכנסים אליה ${ils(sfTotal)} בחודש. 6 שנים אחרי ההפקדה הראשונה אפשר למשוך את הכסף בלי מס. כדאי לבדוק מתי היא נפתחה.`,
    });
  }
  if (otPay && otHours && !has("overtime")) {
    tips.push({
      id: "overtime-hours",
      title: "תשווה לשעות שעבדת",
      text: `שולמו לך ${hours} שעות נוספות. אם עבדת יותר, כדאי להשוות לדוח הנוכחות שלך.`,
    });
  }

  return { info, tips: tips.slice(0, 3) };
}

