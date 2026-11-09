import type { Report } from "./rules";

// The payslip from the approved design, shown until a real one is uploaded.
export const sampleReport: Report = {
  employer: "חברת דוגמה בע״מ",
  month: "2026-10",
  gross: 11800,
  net: 9214,
  owed: 377,
  issues: [
    {
      id: "pension",
      level: "red",
      title: "הפקדה לפנסיה",
      badge: "חסרים ₪312",
      text: "המעסיק הפקיד 6% (₪708) במקום 6.5% מהשכר. זה קורה הרבה, ובדרך כלל מתקנים אחרי פנייה אחת.",
      amount: 312,
      quiet: { value: 708, label: "הפרשת מעביד לפנסיה" },
      where: "\"הפרשת מעביד לפנסיה\", עמוד 1",
    },
    {
      id: "overtime",
      level: "red",
      title: "שעות נוספות",
      badge: "חסרים ₪65",
      text: "4 שעות נוספות חושבו בתעריף רגיל. לפי החוק השעתיים הראשונות ביום משולמות לפחות ב-125%.",
      amount: 65,
      where: "\"שעות נוספות\", עמוד 1",
    },
    {
      id: "points",
      level: "orange",
      title: "נקודות זיכוי",
      badge: "שווה לבדוק",
      text: "רשומות לך 2.25. סיימת תואר או שירות צבאי בשלוש השנים האחרונות? ייתכן שמגיעות לך יותר, עד ₪240 בחודש.",
      amount: 242,
    },
    {
      id: "study-fund",
      level: "orange",
      title: "קרן השתלמות",
      badge: "שווה לבדוק",
      text: "לא מופיעה בתלוש. אם הובטחה לך בחוזה, זה שווה ₪885 בחודש מהמעסיק.",
      amount: 0,
    },
  ],
  ok: ["שכר מינימום", "דמי הבראה", "מס הכנסה", "ביטוח לאומי ובריאות"],
};
