"use client";
import Link from "next/link";
import { useSaved106 } from "@/lib/form106/store";
import { CheckIcon } from "./icons";
import { InfoCard, IssueCard, Label, TipCard } from "./PayslipView";
import { CountUp } from "./Visuals";

export default function Form106View() {
  const r = useSaved106();

  if (!r) {
    return (
      <main className="flex flex-col gap-3 px-5 pb-[170px] pt-5">
        <Link href="/" className="flex min-h-11 items-center text-[15px] text-link">חזרה לבית</Link>
        <h1 className="text-[26px] font-semibold">בדיקת החזר מס</h1>
        <p className="text-[15px] leading-normal text-muted">
          העלה טופס 106 (המעסיק נותן אותו כל שנה, בדרך כלל עד סוף מרץ) ונבדוק אם נוכה ממך יותר מדי מס.
        </p>
        <Link href="/upload?kind=106" className="flex h-11 items-center justify-center rounded-xl bg-btn text-[15px] font-medium text-btn-ink">העלה טופס 106</Link>
      </main>
    );
  }

  const multi = r.years.length > 1;

  return (
    <main className="flex flex-col gap-3 px-5 pb-[170px] pt-5">
      <Link href="/" className="flex min-h-11 items-center text-[15px] text-link">חזרה לבית</Link>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted">טופס 106 · {r.years.map((y) => y.year).join(", ")}</span>
        <h1 className="text-[26px] font-semibold">בדיקת החזר מס</h1>
      </div>

      {r.refund > 0 ? (
        <section className="flex items-center justify-between rounded-[18px] bg-inv px-[18px] py-4 text-inv-ink">
          <span className="text-sm leading-snug">כנראה מגיע לך<br />החזר מס של</span>
          <span className="text-[28px] font-semibold"><CountUp to={r.refund} /></span>
        </section>
      ) : null}

      {r.years.map((y) => (
        <div key={y.year} className="flex flex-col gap-3">
          {multi && <h2 className="mt-3 text-[19px] font-semibold">{y.year}</h2>}
          <span className="text-sm text-muted">{y.employers.join(" · ")}</span>

          {y.issues.map((i) => (
            <IssueCard key={i.id} i={i} />
          ))}
          {y.ok.map((t) => (
            <section key={t} className="flex gap-3 rounded-2xl border border-gtx/30 bg-card p-4">
              <span className="text-gtx"><CheckIcon size={22} /></span>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-medium text-gtx">{t}</h2>
                <p className="text-sm leading-normal text-muted">נוכה ממך בערך המס שהיה צריך. לפי הטופס הזה אין החזר.</p>
              </div>
            </section>
          ))}

          {y.info.length > 0 && <Label>כדאי לדעת</Label>}
          {y.info.map((i) => (
            <InfoCard key={i.id} i={i} net={null} />
          ))}

          {y.tips.length > 0 && <Label>טיפים בשבילך</Label>}
          {y.tips.map((t) => (
            <TipCard key={t.id} t={t} />
          ))}
        </div>
      ))}

      <p className="mt-2 text-[13px] leading-normal text-muted">
        החישוב לפי טופס 106 בלבד ולפי מדרגות המס של אותה שנה. אם היו לך הכנסות אחרות (שכירות, עסק, ריבית), הסכום יכול להשתנות. זה מידע, לא ייעוץ מס.
      </p>
    </main>
  );
}
