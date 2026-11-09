import BottomNav from "@/components/BottomNav";

const months = [
  { m: "מאי", v: 7.8 }, { m: "יוני", v: 8.4 }, { m: "יולי", v: 9.6, hot: true },
  { m: "אוג׳", v: 8.9 }, { m: "ספט׳", v: 7.2 }, { m: "אוק׳", v: 7.4, now: true },
];
const INCOME = 9.3; // thousand ₪
const MAX = 11.2; // chart top, thousand ₪
const h = (v: number) => `${(v / MAX) * 100}%`;

const changes = [
  { t: "חשמל", v: "₪86+", c: "text-otx" },
  { t: "מבצע הסלולר נגמר בדצמבר", v: "₪30+ לחודש", c: "text-otx" },
  { t: "ביטוח רכב חודש", v: "14%+", c: "text-rtx" },
  { t: "סופר", v: "₪210−", c: "text-gtx" },
];
const spend = [
  { t: "דיור", v: 3200 }, { t: "סופר", v: 1900 }, { t: "רכב", v: 900 },
  { t: "חשבונות", v: 640 }, { t: "מנויים", v: 310 },
];

export default function Compare() {
  return (
    <>
      <main className="flex flex-col gap-[18px] px-5 pb-[100px] pt-7">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-semibold">מעקב</h1>
          <span className="text-[15px] text-muted">כמה הוצאת כל חודש, לעומת מה שנכנס</span>
        </div>

        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
          <div className="flex justify-between text-[13px] text-muted">
            <span>הוצאות באלפי ₪, מאי עד אוקטובר</span><span>מקווקו = הכנסה</span>
          </div>
          <div className="relative flex h-[180px] items-end justify-between gap-2.5 border-b border-border2 px-1">
            <div className="absolute inset-x-0 border-t-2 border-dashed border-axis" style={{ bottom: h(INCOME) }} />
            {months.map((x) => (
              <div key={x.m} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className={`text-[11px] ${x.hot ? "font-medium text-otx" : x.now ? "font-medium text-ink" : "text-muted"}`}>{x.v}</span>
                <div className={`w-full rounded-t-md ${x.hot ? "bg-hot" : x.now ? "bg-btn" : "bg-bar"}`} style={{ height: h(x.v) }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-2.5 px-1 text-center text-xs text-muted">
            {months.map((x) => (
              <span key={x.m} className={`flex-1 ${x.now ? "font-medium text-ink" : ""}`}>{x.m}</span>
            ))}
          </div>
          <p className="text-sm leading-normal text-muted">ביולי הוצאת ₪300 יותר ממה שנכנס. מאז זה ירד.</p>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="text-[17px] font-semibold">מה השתנה מספטמבר</h2>
          <div className="rounded-[14px] border border-line bg-card text-[15px]">
            {changes.map((x, i) => (
              <div key={x.t} className={`flex justify-between px-3.5 py-[13px] ${i < changes.length - 1 ? "border-b border-line2" : ""}`}>
                <span>{x.t}</span><span className={`font-medium ${x.c}`}>{x.v}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="text-[17px] font-semibold">לאן הלך הכסף באוקטובר</h2>
          <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-card p-3.5">
            {spend.map((x) => (
              <div key={x.t} className="flex flex-col gap-[5px]">
                <div className="flex justify-between text-sm"><span>{x.t}</span><span>₪{x.v.toLocaleString("he-IL")}</span></div>
                <div className="h-2 rounded-full bg-track">
                  <div className="h-full rounded-full bg-fill" style={{ width: `${Math.round((x.v / spend[0].v) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
