"use client";
import Link from "next/link";
import type { Info, Issue, Report, Tip } from "@/lib/payslip/rules";
import { sampleReport } from "@/lib/payslip/sample";
import { monthName, useSavedReport } from "@/lib/payslip/store";
import Feedback from "./Feedback";
import { BulbIcon, CheckIcon, InfoIcon } from "./icons";

const ils = (n: number) => "₪" + Math.round(n).toLocaleString("he-IL");
const SHOW_INFO = 2;

function IssueCard({ i }: { i: Issue }) {
  const red = i.level === "red";
  return (
    <section className={`flex flex-col gap-2 rounded-2xl border bg-card p-4 ${red ? "border-rtx/30" : "border-otx/30"}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-medium">{i.title}</h3>
        <span className={`flex-none rounded-lg px-2.5 py-1 text-[13px] font-medium ${red ? "bg-rbg text-rtx" : "bg-obg text-otx"}`}>{i.badge}</span>
      </div>
      <p className="text-sm leading-normal text-muted">{i.text}</p>
      {i.todo && (
        <p className="rounded-[10px] bg-soft px-3 py-2 text-sm leading-normal">
          <span className="font-medium">מה עושים: </span>
          {i.todo}
        </p>
      )}
      {red && i.quiet && (
        <div className="flex items-center gap-2 text-[13px] text-muted">
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

function InfoCard({ i }: { i: Info }) {
  return (
    <section className="flex flex-col gap-1.5 rounded-2xl bg-soft p-4">
      <h3 className="flex items-center gap-2 text-[15px] font-medium text-muted">
        <InfoIcon />
        {i.title}
      </h3>
      <p className="text-sm leading-normal text-muted">{i.text}</p>
      {i.rows && (
        <dl className="mt-1 flex flex-col gap-1 text-[13px] text-muted">
          {i.rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3">
              <dt>{r.label}</dt>
              <dd className={r.mine ? "text-gtx" : ""}>{ils(r.amount)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function TipCard({ t }: { t: Tip }) {
  return (
    <section className="flex flex-col gap-1.5 rounded-2xl border border-yln bg-ybg p-4">
      <h3 className="flex items-center gap-2 text-[15px] font-medium text-ytx">
        <BulbIcon />
        {t.title}
      </h3>
      <p className="text-sm leading-normal">{t.text}</p>
    </section>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => <h2 className="mt-2 text-sm text-muted">{children}</h2>;

export default function PayslipView() {
  const saved = useSavedReport();
  const r: Report = saved ?? sampleReport;
  const reds = r.issues.filter((i) => i.level === "red").length;
  const oranges = r.issues.length - reds;
  const meta = ["תלוש שכר", monthName(r.month), r.employer].filter(Boolean).join(" · ");
  const info = r.info ?? [];
  const tips = r.tips ?? [];

  return (
    <main className="flex flex-col gap-3 px-5 pb-[170px] pt-5">
      <Link href="/" className="flex min-h-11 items-center text-[15px] text-link">חזרה לבית</Link>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted">{meta}</span>
        {r.net !== null && (
          <div className="flex items-baseline gap-2.5">
            <span className="text-[40px] font-semibold tracking-tight">{ils(r.net)}</span>
            <span className="text-[15px] text-muted">נטו לחשבון</span>
          </div>
        )}
        {r.gross !== null && <span className="text-sm text-muted">ברוטו {ils(r.gross)}</span>}
      </div>

      <div className="flex items-baseline gap-3.5 rounded-[14px] border border-line bg-card px-3.5 py-3 text-sm font-medium">
        <span className={reds ? "text-rtx" : "text-muted"}>{reds === 1 ? "בעיה אחת" : `${reds} בעיות`}</span>
        <span className={oranges ? "text-otx" : "text-muted"}>{oranges} שווה לבדוק</span>
        {r.ok.length > 0 && <span className="text-gtx">{r.ok.length} בסדר</span>}
      </div>

      {r.owed > 0 && (
        <section className="flex items-center justify-between rounded-[18px] bg-inv px-[18px] py-4 text-inv-ink">
          <span className="text-sm leading-snug">מצאנו כסף<br />שחסר לך בתלוש</span>
          <span className="text-[28px] font-semibold">{ils(r.owed)}</span>
        </section>
      )}

      {r.issues.length > 0 ? (
        <>
          <Label>מה כדאי לטפל בו</Label>
          {r.issues.map((i) => (
            <IssueCard key={i.id} i={i} />
          ))}
        </>
      ) : (
        <section className="flex gap-3 rounded-2xl border border-gtx/30 bg-card p-4">
          <span className="text-gtx"><CheckIcon size={22} /></span>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-medium text-gtx">הכל תקין בתלוש</h2>
            <p className="text-sm leading-normal text-muted">בדקנו {r.ok.length} דברים ולא מצאנו כסף שחסר לך.</p>
          </div>
        </section>
      )}

      {r.ok.length > 0 && (
        <details className="rounded-2xl border border-line bg-card text-[15px]">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-[13px] text-sm">
            <span className="text-gtx"><CheckIcon /></span>
            <span>נבדק ונמצא בסדר ({r.ok.length})</span>
          </summary>
          {r.ok.map((t) => (
            <div key={t} className="flex justify-between border-t border-line2 px-4 py-3">
              <span>{t}</span>
              <span className="text-gtx">בסדר</span>
            </div>
          ))}
        </details>
      )}

      {info.length > 0 && (
        <>
          <Label>כדאי לדעת על התלוש שלך</Label>
          {info.slice(0, SHOW_INFO).map((i) => (
            <InfoCard key={i.id} i={i} />
          ))}
          {info.length > SHOW_INFO && (
            <details className="flex flex-col gap-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm text-link">
                עוד {info.length - SHOW_INFO === 1 ? "דבר אחד" : `${info.length - SHOW_INFO} דברים`} על התלוש
              </summary>
              <div className="flex flex-col gap-3">
                {info.slice(SHOW_INFO).map((i) => (
                  <InfoCard key={i.id} i={i} />
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {tips.length > 0 && (
        <>
          <Label>טיפים בשבילך</Label>
          {tips.map((t) => (
            <TipCard key={t.id} t={t} />
          ))}
        </>
      )}

      {saved && <Feedback report={r} />}

      <p className="mt-2 text-[13px] leading-normal text-muted">
        {saved ? "" : "זו דוגמה. העלה תלוש משלך כדי לראות את הבדיקה שלך. "}
        הבדיקה מבוססת על חוקי העבודה של 2026. זה מידע, לא ייעוץ משפטי.
      </p>
    </main>
  );
}
