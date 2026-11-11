// Daily limit on payslip checks, so a shared demo link can't burn the API credit.
// Kept in server memory: good enough for the demo (a restart resets it). The real
// hard cap is the prepaid credit with auto-reload off.
const PER_PERSON = 5;
const PER_DAY = 150; // ~$4 at ~2.5¢ a check

let day = "";
let total = 0;
const byIp = new Map<string, number>();

/** Returns an error message in Hebrew if this check is over the limit, else counts it. */
export function takeCheck(ip: string): string | null {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    total = 0;
    byIp.clear();
  }
  if (total >= PER_DAY) return "הגענו למספר הבדיקות המקסימלי להיום. נסה שוב מחר.";
  const mine = byIp.get(ip) ?? 0;
  if (mine >= PER_PERSON) return `אפשר לבדוק עד ${PER_PERSON} תלושים ביום. נסה שוב מחר.`;
  byIp.set(ip, mine + 1);
  total++;
  return null;
}
