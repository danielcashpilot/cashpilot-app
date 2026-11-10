import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { PayslipSchema, type Payslip } from "./schema";

// Sonnet for extraction: decided 2026-11-08 (cost vs. Opus).
const MODEL = "claude-sonnet-5-5";

const SYSTEM = `You read Israeli payslips (תלוש שכר) and copy numbers off them.
Rules:
- Copy only numbers that are printed on the document. Never calculate, estimate or fill in a value. If a field is not printed, return null for value, label and page.
- For each value, give the exact Hebrew label printed next to it and the page it is on.
- Amounts are in shekels without the ₪ sign or thousands separators. Hours and percents are plain numbers.
- If a field could match several lines, use the line whose label matches best and keep its own value; do not add lines together, except overtime_pay, which is the sum of all overtime payment lines.
- If the document is not a payslip, set is_payslip to false and leave the rest null.

Where things hide on Israeli payslips (look at the whole page, including side boxes and bottom tables, before returning null):
- Employer contributions (pension_employer, severance_employer, study_fund_employer) are usually NOT in the payments or deductions list. They sit in a separate table or box, titled for example "הפקדות מעסיק", "הפרשות מעסיק", "ניכויים והפרשות לקופות גמל" or "הפקדות מעסיק לקופות גמל", or in a side box with lines like "קופ\"ג מעסיק-חודשי", "קה\"ל מעסיק-חודשי", "פיצויים חודשי".
- In such tables each row is a fund (pension, ביטוח מנהלים, קרן השתלמות, or a fund company name) and the columns split the money: employee deduction (ניכוי מהעובד / עובד), employer תגמולים (הפרשת מעסיק / מעביד / תגמולים) and employer severance (פיצויים). Take each number from the right row and column. The label is the row and column names together, e.g. "קצבה שכיר-תגמולים / הפרשת מעסיק".
- Use monthly amounts (חודשי), never cumulative ones (מצטבר).
- Employee pension and study fund deductions are often listed under the fund's name (e.g. "ביטוח מנהלים", "קרן פנסיה", "אנליסט השתלמות", "כלל", "מגדל"). A study fund line is study_fund_employee, a pension or ביטוח מנהלים line is pension_employee.
- "שעות עודפות" and hours paid at 100% are NOT overtime. Only lines paid at 125%, 150% or more (ש.נ. / שעות נוספות) count as overtime.
- Go through every line of the payments table: besides base salary and overtime, look for דמי הבראה (havraah_pay), even when it is a short line near the bottom.
- Side boxes and "נתונים נוספים" sections often hold אחוז משרה / היקף משרה, נקודות זיכוי and the pension salary. Read them too.
- Regular hours may appear in an information-only section (e.g. "שעות רגילות - ידיעה", "מידע נוסף (לא לתשלום)", "שעות עבודה"). Still copy them to regular_hours.
- The hourly rate may be labeled "ערך שעה", "תעריף שעה", "תע' שעה" or appear in a rates box (תעריפים).`;

export type Media = "application/pdf" | "image/jpeg" | "image/png" | "image/webp";

// Effort "high": medium missed a different field on each run (97%); high got
// 105/105 twice on the test set (scripts/accuracy.mjs), ~2.5¢ and ~10 s a payslip.
// Sonnet 5.5 price, $ per million tokens (input / output).
const PRICE = { input: 2, output: 10 };

export type Usage = { input_tokens: number; output_tokens: number; cost_usd: number };

export async function extractPayslip(data: Buffer, media: Media): Promise<{ payslip: Payslip; usage: Usage }> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from .env.local

  const doc =
    media === "application/pdf"
      ? ({ type: "document", source: { type: "base64", media_type: media, data: data.toString("base64") } } as const)
      : ({ type: "image", source: { type: "base64", media_type: media, data: data.toString("base64") } } as const);

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    output_config: { effort: "high", format: zodOutputFormat(PayslipSchema) },
    messages: [{ role: "user", content: [doc, { type: "text", text: "Extract the fields from this payslip." }] }],
  });

  if (!response.parsed_output) {
    throw new Error(`Claude did not return valid payslip JSON (stop_reason: ${response.stop_reason})`);
  }
  const { input_tokens, output_tokens } = response.usage;
  const cost_usd = (input_tokens * PRICE.input + output_tokens * PRICE.output) / 1e6;
  console.log(`[payslip] ${input_tokens} in / ${output_tokens} out tokens, $${cost_usd.toFixed(4)}`);
  return { payslip: response.parsed_output, usage: { input_tokens, output_tokens, cost_usd } };
}
