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
          {/* Email intake isn't built yet: no address to copy until the real domain exists. */}
          <div className="flex items-center gap-2.5">
            <MailIcon /><span className="text-base font-medium">או שהמסמכים יגיעו לבד</span>
            <span className="rounded-full bg-soft px-2 py-0.5 text-xs text-muted">בקרוב</span>
          </div>
          <p className="text-sm leading-normal text-muted">בקרוב תקבל כתובת מייל אישית, וחשבונות שמגיעים אליך במייל יעברו אליה לבד. אנחנו לא ניכנס לתיבת המייל שלך.</p>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
