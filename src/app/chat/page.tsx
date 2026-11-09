import Link from "next/link";
import { CloseIcon, SendIcon } from "@/components/icons";

const Me = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-[78%] self-start rounded-[18px_18px_4px_18px] bg-btn px-3.5 py-[11px] text-[15px] leading-snug text-btn-ink">{children}</div>
);
const Bot = ({ children }: { children: React.ReactNode }) => (
  <div className="flex max-w-[86%] flex-col gap-2 self-end rounded-[18px_18px_18px_4px] border border-line bg-card px-3.5 py-3 text-[15px] leading-normal">{children}</div>
);

export default function Chat() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-col gap-2 border-b border-line bg-card px-5 pb-3 pt-5">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-semibold">שאל על הכסף שלך</h1>
          <Link href="/" aria-label="סגור" className="flex h-11 w-11 items-center justify-center text-ink"><CloseIcon /></Link>
        </div>
        <span className="self-start rounded-full bg-soft px-3 py-[5px] text-[13px] text-muted">מסתכל על: תלוש אוקטובר</span>
      </header>

      <main className="flex flex-1 flex-col gap-3.5 px-4 py-[18px]">
        <Me>למה הנטו ירד החודש?</Me>
        <Bot>
          <span>ירד ב-₪86. שני דברים:</span>
          <span>1. היו לך 4 שעות נוספות פחות מספטמבר, זה ₪152 פחות בברוטו.</span>
          <span>2. מנגד, מס ההכנסה ירד ב-₪66 בגלל זה.</span>
          <span>אז הנטו ירד בגלל השעות הנוספות, לא בגלל טעות.</span>
          <Link href="/payslip" className="text-sm text-link">ראה את השורות בתלוש</Link>
        </Bot>
        <Me>ומה עושים עם הפנסיה שחסרה?</Me>
        <Bot>
          <span>הכי פשוט: לשלוח לחשבות מייל קצר. הכנתי לך נוסח, רק צריך להוסיף את השם שלך.</span>
          <a href="#" className="text-sm text-link">פתח את המכתב</a>
        </Bot>
      </main>

      <div className="flex flex-wrap gap-2 px-4 pb-2.5">
        {["כמה נשאר לי עד סוף החודש?", "מה זה דמי הבראה?"].map((q) => (
          <button key={q} type="button" className="h-9 rounded-full border border-border2 bg-card px-3 text-[13px] text-ink">{q}</button>
        ))}
      </div>

      <form className="sticky bottom-0 flex items-center gap-2.5 border-t border-line bg-card px-4 pb-[22px] pt-2.5">
        <label htmlFor="msg" className="sr-only">הודעה</label>
        <input id="msg" type="text" placeholder="למשל: למה שילמתי יותר מס?" className="h-[46px] flex-1 rounded-full border border-border2 bg-field px-4 text-[15px] text-ink placeholder:text-muted" />
        <button type="button" aria-label="שלח" className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-btn text-btn-ink"><SendIcon /></button>
      </form>
    </div>
  );
}
