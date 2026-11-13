import { z } from "zod";

// What Claude must read off a טופס 106 (yearly salary summary from the employer).
// Claude only copies printed numbers; the tax math happens in check.ts.
const Field = z.object({
  value: z.number().nullable().describe("The number exactly as printed, in shekels (or a count where the field says so). null if not printed."),
  label: z.string().nullable().describe("The exact Hebrew label printed next to the number, with its field code if printed, e.g. \"042 מס הכנסה\". null if value is null."),
});

export const Form106Schema = z.object({
  is_form106: z.boolean().describe("true only if this document is an Israeli טופס 106 (yearly employer tax summary)."),
  tax_year: z.number().int().nullable().describe("שנת המס, e.g. 2024."),
  employer_name: z.string().nullable(),
  worked_months: z.array(z.number().int()).nullable().describe("The month numbers (1-12) marked as worked in the months table (כן / X), e.g. [5,6,7,8,9,10,11,12]. null if there is no months table."),
  months_worked: z.number().int().nullable().describe("How many months the person worked for this employer that year (סה\"כ חודשי עבודה, or count the months marked as worked)."),

  taxable_income: Field.describe("Total taxable salary: field 158/172 (משכורת / סה\"כ תשלומים חייבים). Not the National Insurance salary."),
  income_tax: Field.describe("Income tax deducted for the year: field 042 (מס הכנסה)."),
  national_insurance: Field.describe("ביטוח לאומי deducted from the employee."),
  health_tax: Field.describe("מס בריאות deducted from the employee."),
  credit_points: Field.describe("Number of tax credit points (נקודות זיכוי), a count like 2.25 or 5.75, NOT shekels. Often printed inside a label like \"ערך נקודות זיכוי 5.75\"."),
  credit_points_value: Field.describe("The SHEKEL amount printed next to the credit points line (e.g. the 10,352 in \"ערך נקודות זיכוי 5.75 ... 10,352\"): the credit actually given in the year."),
  insured_income: Field.describe("The salary the pension was calculated on for the year: field 244/245 (הכנסה מבוטחת / שכר מבוטח). Often less than the taxable salary (no overtime or expenses)."),
  pension_employee: Field.describe("Employee pension deduction for the year: field 045/086 (קצבה כעמית שכיר / קופת גמל לקצבה)."),
  study_fund_employee: Field.describe("Employee קרן השתלמות deduction for the year."),
  employer_pension_total: Field.describe("Employer contributions to pension funds including severance: field 248/249 (סה\"כ הפרשות המעסיק לקופ\"ג)."),
  study_fund_employer: Field.describe("Employer קרן השתלמות contribution for the year (often in the funds table, הפרשת מעסיק on the קרן השתלמות row)."),
  overtime_special: Field.describe("Overtime and special pay for the year, in the income classification section (סיווג הכנסות): e.g. \"ש\"נ ושכר מיוחד\", \"שעות נוספות\"."),
  expenses_cover: Field.describe("Expense reimbursements for the year, in סיווג הכנסות: e.g. \"כיסוי הוצאות\", \"החזר הוצאות\"."),
  fund_base: Field.describe("In the funds table (פירוט קופות), the salary the pension fund row was figured on (ברוטו להפרשה / שכר להפרשה)."),
  pension_employer: Field.describe("In the funds table, the employer's amount on the pension row (קופת גמל לקצבה / קרן פנסיה / תגמולים), column הפרשת מעסיק. Not severance."),
  severance_employer: Field.describe("In the funds table, the employer's amount on the severance row (פיצויים), column הפרשת מעסיק."),
  single_job: z.boolean().nullable().describe("true if the form says the person worked in a single job (הועסק/ה במשרה יחידה), false if it says more than one job, null if not printed."),
  life_insurance: Field.describe("Life insurance paid by the employee: field 036 (ביטוח חיים), if printed."),
  donations: Field.describe("Donations: field 037 (תרומות), if printed."),
});

export type Form106 = z.infer<typeof Form106Schema>;
export type F106Field = z.infer<typeof Field>;
