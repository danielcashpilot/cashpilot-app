import Anthropic from "@anthropic-ai/sdk";
import type { Media } from "@/lib/payslip/extract";
import { extract106 } from "@/lib/form106/extract";
import { check106 } from "@/lib/form106/check";
import { takeCheck } from "@/lib/limit";

const TYPES: Media[] = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
// Vercel refuses request bodies over 4.5MB, for all the files together.
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_FILES = 4;

export const maxDuration = 60;

const fail = (status: number, error: string) => Response.json({ error }, { status });

// POST one or more 106 forms (form field "file", repeated). Forms of the same
// year are added together (several employers). Nothing is saved.
export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return fail(500, "חסר מפתח API בהגדרות השרת");

  const files = (await request.formData()).getAll("file").filter((f): f is File => f instanceof File);
  if (!files.length) return fail(400, "לא הגיע קובץ");
  if (files.length > MAX_FILES) return fail(400, `אפשר עד ${MAX_FILES} טפסים בפעם אחת`);
  if (files.some((f) => !TYPES.includes(f.type as Media))) return fail(400, "אפשר להעלות PDF או תמונה (JPG, PNG)");
  if (files.reduce((s, f) => s + f.size, 0) > MAX_BYTES) return fail(400, "הקבצים גדולים מדי (עד 4MB ביחד)");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (process.env.NODE_ENV === "production") {
    for (let i = 0; i < files.length; i++) {
      const limited = takeCheck(ip);
      if (limited) return fail(429, limited);
    }
  }

  try {
    const read = await Promise.all(files.map(async (f) => extract106(Buffer.from(await f.arrayBuffer()), f.type as Media)));
    const usage = { cost_usd: read.reduce((s, r) => s + r.usage.cost_usd, 0) };
    const bad = files.filter((_, i) => !read[i].form.is_form106).map((f) => f.name);
    if (bad.length === files.length) return Response.json({ error: "זה לא נראה כמו טופס 106", usage }, { status: 422 });
    const forms = read.map((r) => r.form).filter((f) => f.is_form106);
    return Response.json({ forms, report: check106(forms), skipped: bad, usage });
  } catch (err) {
    console.error("[form106]", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
    if (err instanceof Anthropic.AuthenticationError) return fail(500, "מפתח ה-API לא תקין");
    if (err instanceof Anthropic.RateLimitError) return fail(429, "יותר מדי בקשות, נסה שוב בעוד דקה");
    if (err instanceof Anthropic.APIError) return fail(502, "שירות הקריאה לא זמין כרגע, נסה שוב");
    return fail(500, "משהו השתבש בקריאת הטופס");
  }
}
