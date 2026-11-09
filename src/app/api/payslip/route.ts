import Anthropic from "@anthropic-ai/sdk";
import { extractPayslip, type Media } from "@/lib/payslip/extract";
import { checkPayslip } from "@/lib/payslip/rules";

const TYPES: Media[] = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

const fail = (status: number, error: string) => Response.json({ error }, { status });

// POST a payslip file (form field "file"). Returns the extracted numbers and
// the checks. Nothing is saved: the file lives only for this request.
export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return fail(500, "חסר מפתח API בקובץ .env.local");

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail(400, "לא הגיע קובץ");
  if (!TYPES.includes(file.type as Media)) return fail(400, "אפשר להעלות PDF או תמונה (JPG, PNG)");
  if (file.size > MAX_BYTES) return fail(400, "הקובץ גדול מדי (עד 10MB)");

  try {
    const data = Buffer.from(await file.arrayBuffer());
    const payslip = await extractPayslip(data, file.type as Media);
    if (!payslip.is_payslip) return fail(422, "זה לא נראה כמו תלוש שכר");
    return Response.json({ payslip, report: checkPayslip(payslip) });
  } catch (err) {
    console.error("[payslip]", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
    if (err instanceof Anthropic.AuthenticationError) return fail(500, "מפתח ה-API לא תקין");
    if (err instanceof Anthropic.RateLimitError) return fail(429, "יותר מדי בקשות, נסה שוב בעוד דקה");
    if (err instanceof Anthropic.APIError) return fail(502, "שירות הקריאה לא זמין כרגע, נסה שוב");
    return fail(500, "משהו השתבש בקריאת התלוש");
  }
}
