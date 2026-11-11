// "Did this help?" votes from the payslip screen. No database in the demo:
// each vote is one log line, read in Vercel → Logs (search "[feedback]").
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || (body.vote !== "up" && body.vote !== "down")) return Response.json({ error: "bad vote" }, { status: 400 });
  const n = (x: unknown) => (typeof x === "number" && x >= 0 && x < 50 ? x : 0);
  console.log(`[feedback] ${body.vote} reds=${n(body.reds)} oranges=${n(body.oranges)} found=${body.found === true}`);
  return Response.json({ ok: true });
}
