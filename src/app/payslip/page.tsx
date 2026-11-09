import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import ChatFab from "@/components/ChatFab";

function Badge({ level, children }: { level: "red" | "orange"; children: React.ReactNode }) {
  return (
    <span className={`rounded-lg px-2.5 py-1 text-[13px] font-medium ${level === "red" ? "bg-rbg text-rtx" : "bg-obg text-otx"}`}>
      {children}
    </span>
  );
}

function Card({ title, badge, children }: { title: string; badge: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

const Text = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm leading-normal text-muted">{children}</p>
);

const Links = ({ items }: { items: string[] }) => (
  <div className="flex gap-4 text-sm">
    {items.map((t) => (
      <a key={t} href="#" className="text-link">{t}</a>
    ))}
  </div>
);

export default function Payslip() {
  return (
    <>
      <main className="flex flex-col gap-4 px-5 pb-[170px] pt-5">
        <Link href="/" className="flex min-h-11 items-center text-[15px] text-link">חזרה לבית</Link>

        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted">תלוש שכר · אוקטובר 2026 · חברת דוגמה בע״מ</span>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[40px] font-semibold tracking-tight">₪9,214</span>
            <span className="text-[15px] text-muted">נטו לחשבון</span>
          </div>
          <span className="text-sm text-muted">ברוטו ₪11,800 · ₪86 פחות מספטמבר</span>
        </div>

        <div className="flex items-baseline gap-3.5 rounded-[14px] border border-line bg-card px-3.5 py-3 text-sm font-medium">
          <span className="text-rtx">2 בעיות</span>
          <span className="text-otx">2 שווה לבדוק</span>
          <span className="text-gtx">4 בסדר</span>
          <span className="ms-auto font-semibold">₪377 לך</span>
        </div>

        <Card title="הפקדה לפנסיה" badge={<Badge level="red">חסרים ₪312</Badge>}>
          <Text>המעסיק הפקיד 6% (₪708) במקום 6.5% מהשכר. זה קורה הרבה, ובדרך כלל מתקנים אחרי פנייה אחת.</Text>
          <div className="flex items-center gap-2 rounded-[10px] bg-soft px-2.5 py-2 text-[13px] text-muted">
            <span>המספר מהתלוש: ₪708</span>
            <span aria-hidden="true">·</span>
            <a href="#" className="text-link">לא נכון?</a>
          </div>
          <Links items={["מכתב מוכן למעסיק", "איפה זה בתלוש"]} />
        </Card>

        <Card title="שעות נוספות" badge={<Badge level="red">חסרים ₪65</Badge>}>
          <Text>4 שעות נוספות חושבו בתעריף רגיל. לפי החוק השעתיים הראשונות ביום משולמות לפחות ב-125%.</Text>
          <Links items={["מה לבקש מהחשבות", "איפה זה בתלוש"]} />
        </Card>

        <Card title="נקודות זיכוי" badge={<Badge level="orange">שווה לבדוק</Badge>}>
          <Text>רשומות לך 2.25. סיימת תואר או שירות צבאי בשלוש השנים האחרונות? ייתכן שמגיעות לך יותר, עד ₪240 בחודש.</Text>
        </Card>

        <Card title="קרן השתלמות" badge={<Badge level="orange">שווה לבדוק</Badge>}>
          <Text>לא מופיעה בתלוש. אם הובטחה לך בחוזה, זה שווה ₪885 בחודש מהמעסיק.</Text>
        </Card>

        <section className="rounded-2xl border border-line bg-card text-[15px]">
          <div className="border-b border-line2 px-4 py-[13px] text-sm text-muted">נבדק ונמצא בסדר</div>
          {["שכר מינימום", "דמי הבראה", "מס הכנסה", "ביטוח לאומי ובריאות"].map((t, i, a) => (
            <div key={t} className={`flex justify-between px-4 py-3 ${i < a.length - 1 ? "border-b border-line2" : ""}`}>
              <span>{t}</span>
              <span className="text-gtx">בסדר</span>
            </div>
          ))}
        </section>

        <p className="text-[13px] leading-normal text-muted">הבדיקה מבוססת על חוקי העבודה של 2026. זה מידע, לא ייעוץ משפטי.</p>
      </main>
      <ChatFab label="שאל על התלוש" />
      <BottomNav />
    </>
  );
}
