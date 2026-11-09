import { z } from "zod";

// What Claude must read off the payslip. Claude only copies printed numbers;
// all math and every judgement happens in rules.ts.
const Field = z.object({
  value: z.number().nullable().describe("The number exactly as printed, in shekels (or hours / points / percent where the field says so). null if not printed."),
  label: z.string().nullable().describe("The exact Hebrew label printed next to the number, e.g. \"הפרשת מעביד לפנסיה\". null if value is null."),
  page: z.number().int().nullable().describe("1-based page number where the number appears. null if value is null."),
});

export const PayslipSchema = z.object({
  is_payslip: z.boolean().describe("true only if this document is an Israeli payslip (תלוש שכר)."),
  employer_name: z.string().nullable(),
  month: z.string().nullable().describe("Pay month as YYYY-MM."),
  job_percent: Field.describe("היקף משרה / אחוז משרה, in percent (100 = full time)."),

  gross_total: Field.describe("סה\"כ ברוטו / סה\"כ תשלומים."),
  net_pay: Field.describe("נטו לתשלום / נטו בבנק: the amount actually paid to the bank."),
  deductions_total: Field.describe("סה\"כ ניכויים (all deductions together), if printed."),

  base_salary: Field.describe("שכר יסוד / משכורת בסיס for the month."),
  hourly_rate: Field.describe("ערך שעה / תעריף לשעה, if printed."),
  regular_hours: Field.describe("Regular hours worked or paid this month (שעות רגילות / שעות עבודה)."),
  overtime_125_hours: Field.describe("Overtime hours paid at 125% (ש.נ. 125%)."),
  overtime_150_hours: Field.describe("Overtime hours paid at 150% (ש.נ. 150%)."),
  overtime_total_hours: Field.describe("Total overtime hours, only if the payslip does not split them by rate."),
  overtime_pay: Field.describe("Total shekels paid for overtime (sum of all overtime lines)."),
  havraah_pay: Field.describe("דמי הבראה paid this month."),

  income_tax: Field.describe("מס הכנסה deducted."),
  national_insurance: Field.describe("ביטוח לאומי deducted from the employee."),
  health_tax: Field.describe("מס בריאות deducted from the employee."),
  tax_credit_points: Field.describe("נקודות זיכוי (a count like 2.25, not shekels)."),

  pension_salary: Field.describe("The salary the pension is calculated on (שכר מבוטח / שכר לפנסיה / שכר קובע), if printed."),
  pension_employee: Field.describe("Employee pension deduction (ניכוי עובד לפנסיה / תגמולי עובד)."),
  pension_employer: Field.describe("Employer pension contribution for תגמולים only (הפרשת מעביד לפנסיה / תגמולי מעביד), NOT including severance."),
  severance_employer: Field.describe("Employer severance contribution (פיצויים)."),
  study_fund_employee: Field.describe("Employee קרן השתלמות deduction."),
  study_fund_employer: Field.describe("Employer קרן השתלמות contribution."),
});

export type Payslip = z.infer<typeof PayslipSchema>;
export type PField = z.infer<typeof Field>;
