"use client";
import Link from "next/link";
import type { Issue, Report } from "@/lib/payslip/rules";
import { sampleReport } from "@/lib/payslip/sample";
import { monthName, useSavedReport } from "@/lib/payslip/store";

const ils = (n: number) => "₪" + Math.round(n).toLocaleString("he-IL");

function IssueCard({ i }: { i: Issue }) {
  const red = i.level === "red";
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">{i.title}</h2>
        <span className={`flex-none rounded-lg px-2.5 py-1 text-[13px] font-medium ${red ? "bg-rbg text-rtx" : "bg-obg text-otx"}`}>{i.badge}</span>
      </div>
      <p className="text-sm leading-normal text-muted">{i.text}</p>
      {red && i.quiet && (
        <div className="flex items-center gap-2 rounded-[10px] bg-soft px-2.5 py-2 text-[13px] text-muted">
          <span>המספר מהתלוש: {ils(i.quiet.value)}</span>
          <span aria-hidden="true">·</span>
          <a href="#" className="text-link">לא נכון?</a>
        </div>
      )}
      {i.where && (
        <details className="text-sm">
          <summary className="cursor-pointer list-none text-link">איפה זה בתלוש</summary>
          <p className="pt-1 text-muted">בשורה {i.where}</p>
        </details>
      )}
    </section>
  );
}

export default function PayslipView() {
  const saved = useSavedReport();
  const r: Report = saved ?? sampleReport;
  const reds = r.issues.filter((i) => i.level === "red").length;
  const oranges = r.issues.length - reds;
  const meta = ["תלוש שכר", monthName(r.month), r.employer].filter(Boolean).join(" · ");

  return (
    <main className="flex flex-col gap-4 px-5 pb-[170px] pt-5">
      <Link href="/" className="flex min-h-11 items-center text-[15px] text-link">חזרה לבית</Link>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted">{meta}</span>
        {r.net !== null && (
          <div className="flex items-baseline gap-2.5">
            <span className="text-[40px] font-semibold tracking-tight">{ils(r.net)}</span>
            <span className="text-[15px] text-muted">נטו לחשבון</span>
          </div>
        )}
        {r.gross !== null && (
          <span className="text-sm text-muted">ברוטו {ils(r.gross)}{saved ? "" : " · ₪86 פחות מספטמבר"}</span>
        )}
      </div>

      <div className="flex items-baseline gap-3.5 rounded-[14px] border border-line bg-card px-3.5 py-3 text-sm font-medium">
        {reds > 0 && <span className="text-rtx">{reds === 1 ? "בעיה אחת" : `${reds} בעיות`}</span>}
        {oranges > 0 && <span className="text-otx">{oranges} שווה לבדוק</span>}
        {r.ok.length > 0 && <span className="text-gtx">{r.ok.length} בסדר</span>}
        {r.owed > 0 && <span className="ms-auto font-semibold">{ils(r.owed)} לך</span>}
      </div>

      {r.issues.map((i) => (
        <IssueCard key={i.id} i={i} />
      ))}

      {r.ok.length > 0 && (
        <section className="rounded-2xl border border-line bg-card text-[15px]">
          <div className="border-b border-line2 px-4 py-[13px] text-sm text-muted">נבדק ונמצא בסדר</div>
          {r.ok.map((t, idx) => (
            <div key={t} className={`flex justify-between px-4 py-3 ${idx < r.ok.length - 1 ? "border-b border-line2" : ""}`}>
              <span>{t}</span>
              <span className="text-gtx">בסדר</span>
            </div>
          ))}
        </section>
      )}

      <p className="text-[13px] leading-normal text-muted">
        {saved ? "" : "זו דוגמה. העלה תלוש משלך כדי לראות את הבדיקה שלך. "}
        הבדיקה מבוססת על חוקי העבודה של 2026. זה מידע, לא ייעוץ משפטי.
      </p>
    </main>
  );
}
