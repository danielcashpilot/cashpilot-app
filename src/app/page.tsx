import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import ChatFab from "@/components/ChatFab";
import ThemeToggle from "@/components/ThemeToggle";
import { AlertIcon, WarnIcon } from "@/components/icons";
import { issues, sortIssues } from "@/lib/sample";

const SHOW = 4;

export default function Home() {
  const sorted = sortIssues(issues);
  const shown = sorted.slice(0, SHOW);
  const more = sorted.length - shown.length;
  const reds = issues.filter((i) => i.level === "red").length;
  const oranges = issues.length - reds;

  return (
    <>
      <main className="flex flex-col gap-[18px] px-5 pb-[170px] pt-7">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-semibold">ערב טוב</h1>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted">נובמבר 2026</span>
            <ThemeToggle />
          </div>
        </div>

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

        <div className="flex gap-3.5 rounded-[14px] border border-line bg-card px-3.5 py-3 text-sm font-medium">
          <span className="text-rtx">{reds} בעיות</span>
          <span className="text-otx">{oranges} שים לב</span>
          <span className="text-gtx">5 בסדר</span>
        </div>

        <section className="flex flex-col gap-2.5">
          <h2 className="text-[17px] font-semibold">מה כדאי לטפל בו</h2>
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

        <section className="flex items-center justify-between rounded-[18px] bg-inv px-[18px] py-4 text-inv-ink">
          <span className="text-sm leading-snug">מצאנו לך עד עכשיו<br />כסף שאפשר להחזיר</span>
          <span className="text-[28px] font-semibold">₪1,301</span>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-semibold">מסמכים אחרונים</h2>
            <Link href="/upload" className="text-sm text-link">הוסף</Link>
          </div>
          <div className="rounded-[14px] border border-line bg-card text-[15px]">
            <Link href="/payslip" className="flex justify-between border-b border-line2 px-3.5 py-[13px]">
              <span>תלוש שכר · אוקטובר</span><span className="text-[13px] text-rtx">2 בעיות</span>
            </Link>
            <div className="flex justify-between border-b border-line2 px-3.5 py-[13px]">
              <span>פירוט אשראי · אוקטובר</span><span className="text-[13px] text-otx">שים לב</span>
            </div>
            <div className="flex justify-between px-3.5 py-[13px]">
              <span>חשבון חשמל · הגיע במייל</span><span className="text-[13px] text-otx">שים לב</span>
            </div>
          </div>
        </section>
      </main>
      <ChatFab />
      <BottomNav />
    </>
  );
}
