import BottomNav from "@/components/BottomNav";
import UploadBox from "@/components/UploadBox";
import { MailIcon } from "@/components/icons";

export default function Upload() {
  return (
    <>
      <main className="flex flex-col gap-[18px] px-5 pb-[100px] pt-7">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-semibold">הוספת מסמך</h1>
          <span className="text-[15px] text-muted">תלוש, דף חשבון, פירוט אשראי או כל חשבון</span>
        </div>

        <UploadBox />

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
