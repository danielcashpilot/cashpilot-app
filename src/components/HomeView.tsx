"use client";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { AlertIcon, WarnIcon } from "@/components/icons";
import type { Report } from "@/lib/payslip/rules";
import { monthName, useSavedReport } from "@/lib/payslip/store";
import { issues as sampleIssues, sortIssues, type Issue } from "@/lib/sample";

const SHOW = 4;
const MAYBE = new Set(["points", "study-fund"]);
const ils = (n: number) => "₪" + Math.round(n).toLocaleString("he-IL");

/** Turn the checked payslip into home-screen rows. */
function fromReport(r: Report): Issue[] {
  const month = monthName(r.month)?.split(" ")[0];
  return r.issues.map((i) => ({
    id: i.id,
    level: i.level,
    certainty: i.level === "red" || !MAYBE.has(i.id) ? "sure" : "maybe",
    amount: i.amount,
    title: i.level === "red" ? `${i.title}: ${i.badge}` : i.title,
    sub: `תלוש ${month ?? ""} · ${i.text.split(/:|\.(?!\d)/)[0]}`,
    href: "/payslip",
  }));
}

export default function HomeView() {
  const saved = useSavedReport();

  // With a real payslip the home screen shows only the user's own data. Before
  // any upload it shows the sample, clearly marked as one.
  const list = saved ? fromReport(saved) : sampleIssues;
  const sorted = sortIssues(list);
  const shown = sorted.slice(0, SHOW);
  const more = sorted.length - shown.length;
  const reds = list.filter((i) => i.level === "red").length;
  const oranges = list.length - reds;
  const okCount = saved ? saved.ok.length : 5;
  const found = saved ? saved.owed : 1301;

  const slipReds = saved ? saved.issues.filter((i) => i.level === "red").length : 2;
  const slipStatus =
    slipReds > 0
      ? { text: slipReds === 1 ? "בעיה אחת" : `${slipReds} בעיות`, cls: "text-rtx" }
      : saved && saved.issues.length > 0
        ? { text: "שים לב", cls: "text-otx" }
        : { text: "בסדר", cls: "text-gtx" };
  const slipMonth = saved ? (monthName(saved.month)?.split(" ")[0] ?? "") : "אוקטובר";

  return (
    <main className="flex flex-col gap-[18px] px-5 pb-[170px] pt-7">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-semibold">ערב טוב</h1>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted">נובמבר 2026</span>
          <ThemeToggle />
        </div>
      </div>

      {!saved && (
        <div className="rounded-[14px] bg-soft px-3.5 py-3 text-sm leading-normal text-muted">
          זו דוגמה של איך זה ייראה.{" "}
          <Link href="/upload" className="text-link">העלה תלוש משלך</Link> והבדיקה תהיה שלך.
        </div>
      )}

      {saved ? (
        <section className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-card p-[18px]">
          <span className="text-sm text-muted">המשכורת של {slipMonth}{saved.employer ? ` · ${saved.employer}` : ""}</span>
          {saved.net !== null && (
            <div className="flex items-baseline gap-2.5">
              <span className="text-[40px] font-semibold tracking-tight">{ils(saved.net)}</span>
              <span className="text-[15px] text-muted">נטו</span>
            </div>
          )}
          {saved.gross !== null && <span className="text-[13px] text-muted">ברוטו {ils(saved.gross)}</span>}
          <Link href="/upload" className="mt-1 rounded-[10px] bg-soft px-3 py-2.5 text-[13px] leading-normal text-muted">
            רוצה לדעת כמה נשאר לך החודש? <span className="text-link">העלה פירוט אשראי או דף בנק</span>
          </Link>
        </section>
      ) : (
        <section className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-card p-[18px]">
          <span className="text-sm text-muted">נשאר לך החודש</span>
          <span className="text-[40px] font-semibold tracking-tight">₪3,140</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-track">
            <div className="h-full w-[66%] rounded-full bg-fill" />
          </div>
          <div className="flex justify-between text-[13px] text-muted">
            <span>הוצאת ₪6,074 מתוך ₪9,214</span>
            <span>18 ימים למשכורת</span>
          </div>
        </section>
      )}

      <div className="flex gap-3.5 rounded-[14px] border border-line bg-card px-3.5 py-3 text-sm font-medium">
        {reds > 0 && <span className="text-rtx">{reds === 1 ? "בעיה אחת" : `${reds} בעיות`}</span>}
        {oranges > 0 && <span className="text-otx">{oranges} שים לב</span>}
        {okCount > 0 && <span className="text-gtx">{okCount} בסדר</span>}
      </div>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[17px] font-semibold">מה כדאי לטפל בו</h2>
        {shown.length === 0 && (
          <Link href="/payslip" className="rounded-[14px] border border-line bg-card p-3.5 text-[15px]">
            <span className="text-gtx">הכל נראה בסדר בתלוש.</span>{" "}
            <span className="text-muted">בדקנו {okCount} דברים ולא מצאנו בעיה.</span>
          </Link>
        )}
        {shown.map((i) => {
          const red = i.level === "red";
          const body = (
            <>
              <span className={`flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] ${red ? "bg-rbg text-rtx" : "bg-obg text-otx"}`}>
                {red ? <AlertIcon /> : <WarnIcon />}
              </span>
              <span className="flex flex-col gap-[3px]">
                <span className="text-[15px] font-medium">{i.title}</span>
                <span className="text-[13px] text-muted">{i.sub}</span>
              </span>
            </>
          );
          const cls = "flex items-start gap-3 rounded-[14px] border border-line bg-card p-3.5";
          return i.href ? (
            <Link key={i.id} href={i.href} className={cls}>{body}</Link>
          ) : (
            <div key={i.id} className={cls}>{body}</div>
          );
        })}
        {more > 0 && (
          <Link href="/payslip" className="flex min-h-11 items-center text-sm text-link">
            עוד {more} דברים לבדוק
          </Link>
        )}
      </section>

      {found > 0 && (
        <section className="flex items-center justify-between rounded-[18px] bg-inv px-[18px] py-4 text-inv-ink">
          <span className="text-sm leading-snug">מצאנו לך עד עכשיו<br />כסף שאפשר להחזיר</span>
          <span className="text-[28px] font-semibold">{ils(found)}</span>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-semibold">מסמכים אחרונים</h2>
          <Link href="/upload" className="text-sm text-link">הוסף</Link>
        </div>
        <div className="rounded-[14px] border border-line bg-card text-[15px]">
          <Link href="/payslip" className={`flex justify-between px-3.5 py-[13px] ${saved ? "" : "border-b border-line2"}`}>
            <span>תלוש שכר · {slipMonth}</span><span className={`text-[13px] ${slipStatus.cls}`}>{slipStatus.text}</span>
          </Link>
          {!saved && (
            <>
              <div className="flex justify-between border-b border-line2 px-3.5 py-[13px]">
                <span>פירוט אשראי · אוקטובר</span><span className="text-[13px] text-otx">שים לב</span>
              </div>
              <div className="flex justify-between px-3.5 py-[13px]">
                <span>חשבון חשמל · הגיע במייל</span><span className="text-[13px] text-otx">שים לב</span>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
