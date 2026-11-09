// Sample data for the demo screens. The payslip page will switch to real
// extracted data in step 2; the other screens stay on sample data.

export type Level = "red" | "orange";

export type Issue = {
  id: string;
  level: Level;
  /** "sure" = money we can show is owed or lost; "maybe" = depends on the user */
  certainty: "sure" | "maybe";
  amount: number; // ₪ per month, used for sorting
  title: string;
  sub: string;
  href?: string;
};

export const issues: Issue[] = [
  { id: "pension", level: "red", certainty: "sure", amount: 312, title: "חסרים ₪312 בהפקדה לפנסיה", sub: "תלוש אוקטובר · המעסיק הפקיד 6% במקום 6.5%", href: "/payslip" },
  { id: "overtime", level: "red", certainty: "sure", amount: 65, title: "שעות נוספות שולמו בחסר: ₪65", sub: "תלוש אוקטובר · 4 שעות חושבו כשעות רגילות", href: "/payslip" },
  { id: "double", level: "orange", certainty: "sure", amount: 49.9, title: "חיוב כפול של ₪49.90", sub: "אשראי · אותו מנוי סטרימינג פעמיים באוקטובר" },
  { id: "power", level: "orange", certainty: "sure", amount: 86, title: "חשבון החשמל עלה ב-₪86", sub: "לעומת ספטמבר · כנראה המזגן", href: "/compare" },
  { id: "points", level: "orange", certainty: "maybe", amount: 240, title: "ייתכן שמגיעות לך עוד נקודות זיכוי", sub: "תלוש אוקטובר · רשומות 2.25", href: "/payslip" },
  { id: "study", level: "orange", certainty: "maybe", amount: 885, title: "קרן השתלמות לא מופיעה בתלוש", sub: "תלוש אוקטובר · שווה לבדוק בחוזה", href: "/payslip" },
];

/** Problems first, then sure orange items, then "maybe" items; inside each, by money. */
export function sortIssues(list: Issue[]): Issue[] {
  const tier = (i: Issue) => (i.level === "red" ? 0 : i.certainty === "sure" ? 1 : 2);
  return [...list].sort((a, b) => tier(a) - tier(b) || b.amount - a.amount);
}

export const shekel = (n: number) =>
  "₪" + n.toLocaleString("he-IL", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
