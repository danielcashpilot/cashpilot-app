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
- If the document is not a payslip, set is_payslip to false and leave the rest null.`;

export type Media = "application/pdf" | "image/jpeg" | "image/png" | "image/webp";

export async function extractPayslip(data: Buffer, media: Media): Promise<Payslip> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from .env.local

  const doc =
    media === "application/pdf"
      ? ({ type: "document", source: { type: "base64", media_type: media, data: data.toString("base64") } } as const)
      : ({ type: "image", source: { type: "base64", media_type: media, data: data.toString("base64") } } as const);

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    output_config: { effort: "medium", format: zodOutputFormat(PayslipSchema) },
    messages: [{ role: "user", content: [doc, { type: "text", text: "Extract the fields from this payslip." }] }],
  });

  if (!response.parsed_output) {
    throw new Error(`Claude did not return valid payslip JSON (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output;
}
