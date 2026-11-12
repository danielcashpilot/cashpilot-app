// Israeli income tax on salary (הכנסה מיגיעה אישית), by year.
// Brackets: annual upper limit and rate; above the last limit 50% (47% + 3% surtax).
// Sources, checked 2026-11-12: kolzchut.org.il "מדרגות מס הכנסה - נתוני עבר" and
// "נקודת זיכוי". 2025 brackets and points were frozen at the 2024 values.
type Year = { brackets: [number, number][]; point: number; pensionCap: number };

const B2024: [number, number][] = [[84120, 0.1], [120720, 0.14], [193800, 0.2], [269280, 0.31], [560280, 0.35], [721560, 0.47]];

// The 35% pension credit (סעיף 45א) counts deposits up to 7% of the insured salary
// (הכנסה מבוטחת, not the whole income), and that salary only up to pensionCap a year.
// Approximate (9,700 ₪ a month from 2023, 8,800 before); only matters above it.
export const TAX: Record<number, Year> = {
  2020: { brackets: [[75960, 0.1], [108960, 0.14], [174960, 0.2], [243120, 0.31], [505920, 0.35], [651600, 0.47]], point: 2628, pensionCap: 105600 },
  2021: { brackets: [[75480, 0.1], [108360, 0.14], [173880, 0.2], [241680, 0.31], [502920, 0.35], [647640, 0.47]], point: 2616, pensionCap: 105600 },
  2022: { brackets: [[77400, 0.1], [110880, 0.14], [178080, 0.2], [247440, 0.31], [514920, 0.35], [663240, 0.47]], point: 2676, pensionCap: 105600 },
  2023: { brackets: [[81480, 0.1], [116760, 0.14], [187440, 0.2], [260520, 0.31], [542160, 0.35], [698280, 0.47]], point: 2820, pensionCap: 116400 },
  2024: { brackets: B2024, point: 2904, pensionCap: 116400 },
  2025: { brackets: B2024, point: 2904, pensionCap: 116400 },
};

/** Tax by the brackets, before any credit. */
export function bracketTax(income: number, brackets: [number, number][]): number {
  let tax = 0;
  let from = 0;
  for (const [to, rate] of brackets) {
    if (income <= from) return tax;
    tax += (Math.min(income, to) - from) * rate;
    from = to;
  }
  return tax + Math.max(0, income - from) * 0.5;
}

export type TaxCalc = { grossTax: number; pointsCredit: number; pensionCredit: number; otherCredit: number; due: number };

/** The yearly tax a salaried person should pay, from the numbers on their 106 forms. */
export function taxDue(year: number, x: { income: number; insured: number; points: number; pension: number; life: number; donations: number }): TaxCalc | null {
  const t = TAX[year];
  if (!t) return null;
  const grossTax = bracketTax(x.income, t.brackets);
  const pointsCredit = x.points * t.point;
  const pensionCredit = 0.35 * Math.min(x.pension, 0.07 * Math.min(x.insured, t.pensionCap));
  // Donations: 35% credit (only from 200 ₪ a year). Life insurance: 25%. Both kept simple.
  const otherCredit = (x.donations >= 200 ? 0.35 * x.donations : 0) + 0.25 * x.life;
  const due = Math.max(0, grossTax - pointsCredit - pensionCredit - otherCredit);
  return { grossTax, pointsCredit, pensionCredit, otherCredit, due };
}
