"use client";
import { useState } from "react";
import type { Report } from "@/lib/payslip/rules";

// "Did this help?" for the demo testers. Sends only the vote and counts, no
// numbers from the payslip; it shows up in the server log (Vercel → Logs).
export default function Feedback({ report }: { report: Report }) {
  const [sent, setSent] = useState<"up" | "down" | null>(null);

  function vote(v: "up" | "down") {
    setSent(v);
    const reds = report.issues.filter((i) => i.level === "red").length;
    fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ vote: v, reds, oranges: report.issues.length - reds, found: report.owed > 0 }),
    }).catch(() => {});
  }

  if (sent) return <p className="mt-2 rounded-2xl bg-soft p-4 text-center text-sm text-muted">תודה! זה עוזר לנו לשפר.</p>;

  return (
    <section className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3">
      <span className="text-[15px]">הבדיקה עזרה לך?</span>
      <div className="flex gap-2">
        <button type="button" onClick={() => vote("up")} className="h-11 rounded-xl border border-border2 px-4 text-[15px]">כן 👍</button>
        <button type="button" onClick={() => vote("down")} className="h-11 rounded-xl border border-border2 px-4 text-[15px]">לא 👎</button>
      </div>
    </section>
  );
}
