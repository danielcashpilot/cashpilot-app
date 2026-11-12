import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Media, Usage } from "../payslip/extract";
import { Form106Schema, type Form106 } from "./schema";

// Same model and effort as the payslip reader (decided 2026-11-08).
const MODEL = "claude-sonnet-5-5";
const PRICE = { input: 2, output: 10 };

const SYSTEM = `You read Israeli טופס 106 forms (the employer's yearly salary and tax summary) and copy numbers off them.
Rules:
- Copy only numbers printed on the document. Never calculate or fill in a value. If a field is not printed, return null for value and label.
- For each value give the exact Hebrew label printed next to it, with the field code (שדה/סעיף) if printed, e.g. "042 מס הכנסה".
- Amounts are in shekels without the ₪ sign or thousands separators.
- Fields are often identified by their code: 158/172 taxable salary, 042 income tax, 244/245 insured salary (the pension base), 045/086 employee pension, 248/249 employer pension contributions, 036 life insurance, 037 donations.
- credit_points is the NUMBER of points (e.g. 2.25), which is often printed inside a label like "ערך נקודות זיכוי 5.75" next to a shekel amount. Return the count, not the shekels.
- months_worked: use "סה\\"כ חודשי עבודה" if printed; otherwise count the months marked as worked (כן / X).
- The employer's study fund contribution is usually in the funds table (פירוט קופות) on the קרן השתלמות row, column הפרשת מעסיק.
- If the document is not a טופס 106, set is_form106 to false and leave the rest null.`;

export async function extract106(data: Buffer, media: Media): Promise<{ form: Form106; usage: Usage }> {
  const client = new Anthropic();
  const doc =
    media === "application/pdf"
      ? ({ type: "document", source: { type: "base64", media_type: media, data: data.toString("base64") } } as const)
      : ({ type: "image", source: { type: "base64", media_type: media, data: data.toString("base64") } } as const);

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    output_config: { effort: "high", format: zodOutputFormat(Form106Schema) },
    messages: [{ role: "user", content: [doc, { type: "text", text: "Extract the fields from this form." }] }],
  });
  if (!response.parsed_output) throw new Error(`Claude did not return valid 106 JSON (stop_reason: ${response.stop_reason})`);
  const { input_tokens, output_tokens } = response.usage;
  const cost_usd = (input_tokens * PRICE.input + output_tokens * PRICE.output) / 1e6;
  console.log(`[form106] ${input_tokens} in / ${output_tokens} out tokens, $${cost_usd.toFixed(4)}`);
  return { form: response.parsed_output, usage: { input_tokens, output_tokens, cost_usd } };
}
