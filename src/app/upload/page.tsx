import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { MailIcon, UploadIcon } from "@/components/icons";

export default function Upload() {
  return (
    <>
      <main className="flex flex-col gap-[18px] px-5 pb-[100px] pt-7">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-semibold">הוספת מסמך</h1>
          <span className="text-[15px] text-muted">תלוש, דף חשבון, פירוט אשראי או כל חשבון</span>
        </div>

        <section className="flex flex-col items-center gap-3.5 rounded-[18px] border-2 border-dashed border-dash bg-card px-[18px] py-7 text-center">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-ibg text-link"><UploadIcon /></span>
          <span className="text-base font-medium">גרור לכאן או צלם את המסמך</span>
          <span className="text-[13px] text-muted">עד 5 קבצים בבת אחת · PDF או תמונה</span>
          <div className="flex gap-2.5">
            <button type="button" className="h-11 rounded-xl bg-btn px-[18px] text-[15px] font-medium text-btn-ink">צלם</button>
            <button type="button" className="h-11 rounded-xl border border-border2 bg-card px-[18px] text-[15px] text-ink">בחר קובץ</button>
          </div>
        </section>

        <section className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-card p-3.5">
          <span className="text-[13px] text-muted">הועלה עכשיו</span>
          <div className="flex items-center justify-between">
            <span className="text-[15px]">tlush_oct.pdf</span>
            <span className="text-[13px] text-muted">2 עמודים</span>
          </div>
          <span className="text-[15px]">זיהינו: <b className="font-semibold">תלוש שכר, אוקטובר 2026</b></span>
          <div className="flex gap-2.5">
            <Link href="/payslip" className="flex h-11 flex-1 items-center justify-center rounded-xl bg-fill text-[15px] font-medium text-bg">פתח את הבדיקה</Link>
            <button type="button" className="h-11 rounded-xl border border-border2 bg-card px-4 text-[15px] text-ink">זה משהו אחר</button>
          </div>
        </section>

        <section className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-card p-4">
          <div className="flex items-center gap-2.5"><MailIcon /><span className="text-base font-medium">או שהמסמכים יגיעו לבד</span></div>
          <p className="text-sm leading-normal text-muted">חשבונות שמגיעים אליך במייל יעברו לכתובת הזאת. אנחנו לא נכנסים לתיבת המייל שלך.</p>
          <div className="flex items-center justify-between rounded-[10px] bg-field px-3 py-2.5">
            <span dir="ltr" className="font-mono text-sm">noa.4821@in.cashpilot.co.il</span>
            <button type="button" className="h-9 rounded-lg border border-border2 bg-card px-3 text-sm text-ink">העתק</button>
          </div>
          <a href="#" className="text-sm text-link">הגדרת העברה אוטומטית · 2 דקות</a>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
