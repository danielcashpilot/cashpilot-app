"use client";
import { useEffect, useState } from "react";
import type { Info, Score } from "@/lib/payslip/rules";

const ils = (n: number) => "₪" + Math.round(n).toLocaleString("he-IL");

/** Counts up from 0 to `to` once, ~0.8 s. Shows the final number at once for reduced motion. */
export function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(to);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 800);
      setN(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{ils(n)}</>;
}

/** Payslip score card: ring + what would raise it. */
export function ScoreCard({ s }: { s: Score }) {
  const color = s.value >= 85 ? "var(--gtx)" : s.value >= 60 ? "var(--otx)" : "var(--rtx)";
  const c = 2 * Math.PI * 26;
  return (
    <section className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4">
      <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`ציון התלוש ${s.value} מתוך 100`} className="flex-none -rotate-90">
        <circle cx="32" cy="32" r="26" fill="none" stroke="var(--track)" strokeWidth="7" />
        <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(s.value / 100) * c} ${c}`} />
        <text x="32" y="32" textAnchor="middle" dominantBaseline="central" transform="rotate(90 32 32)" fontSize="19" fontWeight="600" fill="var(--ink)">{s.value}</text>
      </svg>
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-medium">ציון התלוש: {s.value}/100</h2>
        <p className="text-sm leading-normal text-muted">
          {s.next ? `תטפל ב${s.next.title} והציון יעלה ל-${s.next.to}.` : "התלוש מסודר. אין מה לתקן."}
        </p>
      </div>
    </section>
  );
}

/** Donut for "where the money went": net, money kept for you, taxes, other. */
export function MoneyDonut({ net, rows }: { net: number; rows: NonNullable<Info["rows"]> }) {
  const mine = rows.filter((r) => r.mine).reduce((s, r) => s + r.amount, 0);
  const other = rows.filter((r) => r.label === "ניכויים אחרים").reduce((s, r) => s + r.amount, 0);
  const tax = rows.reduce((s, r) => s + r.amount, 0) - mine - other;
  const parts = [
    { label: "נכנס לחשבון", amount: net, color: "var(--fill)" },
    { label: "נחסך בשבילך", amount: mine, color: "var(--gtx)" },
    { label: "מסים וביטוח לאומי", amount: tax, color: "var(--axis)" },
    { label: "ניכויים אחרים", amount: other, color: "var(--dash)" },
  ].filter((p) => p.amount > 0);
  const total = parts.reduce((s, p) => s + p.amount, 0);
  const c = 2 * Math.PI * 30;
  let at = 0;
  return (
    <div className="mt-1 flex items-center gap-4">
      <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true" className="flex-none -rotate-90">
        {parts.map((p) => {
          const len = (p.amount / total) * c;
          const el = <circle key={p.label} cx="42" cy="42" r="30" fill="none" stroke={p.color} strokeWidth="14" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-at} />;
          at += len;
          return el;
        })}
      </svg>
      <ul className="flex flex-1 flex-col gap-1 text-[13px] text-muted">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: p.color }} />{p.label}</span>
            <span>{Math.round((p.amount / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
