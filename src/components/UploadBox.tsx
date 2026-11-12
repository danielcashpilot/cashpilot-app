"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Report } from "@/lib/payslip/rules";
import { monthName, saveReport } from "@/lib/payslip/store";
import type { Report106 } from "@/lib/form106/check";
import { save106 } from "@/lib/form106/store";
import { UploadIcon } from "./icons";

type State =
  | { s: "idle" }
  | { s: "reading"; name: string }
  | { s: "done"; name: string; report: Report }
  | { s: "done106"; name: string; report: Report106 }
  | { s: "error"; name: string; message: string };

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const MAX_BYTES = 4 * 1024 * 1024; // the server (Vercel) accepts up to ~4.5MB

/** Phone photos are often 3-8MB. Shrink big images to a JPEG that is still sharp enough to read. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= 1.5 * 1024 * 1024) return file;
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
  return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
}

type Kind = "payslip" | "106";
const KINDS: { k: Kind; label: string }[] = [
  { k: "payslip", label: "תלוש שכר" },
  { k: "106", label: "טופס 106" },
];

/** start: /upload?kind=106 opens straight on the 106 choice. */
export default function UploadBox({ start = "payslip" }: { start?: Kind }) {
  const [state, setState] = useState<State>({ s: "idle" });
  const [kind, setKind] = useState<Kind>(start);
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function send106(files: File[]) {
    const name = files.map((f) => f.name).join(", ");
    setState({ s: "reading", name });
    try {
      const small = await Promise.all(files.map(shrink));
      if (small.reduce((s, f) => s + f.size, 0) > MAX_BYTES) throw new Error("הקבצים גדולים מדי (עד 4MB ביחד).");
      const body = new FormData();
      for (const f of small) body.append("file", f);
      const res = await fetch("/api/form106", { method: "POST", body });
      const json = await res.json().catch(() => ({ error: res.status === 413 ? "הקבצים גדולים מדי" : "משהו השתבש, נסה שוב" }));
      if (!res.ok) throw new Error(json.error ?? "משהו השתבש");
      save106(json.report);
      setState({ s: "done106", name, report: json.report });
    } catch (e) {
      setState({ s: "error", name, message: e instanceof Error ? e.message : "משהו השתבש" });
    }
  }

  // A file named like "106" goes to the 106 check even if the choice was left on payslip.
  function go(files: File[]) {
    if (!files.length) return;
    if (kind === "106" || files.every((f) => /106/.test(f.name))) {
      setKind("106");
      send106(files.slice(0, 4));
    } else send(files[0]);
  }

  async function send(file: File) {
    setState({ s: "reading", name: file.name });
    try {
      const small = await shrink(file);
      if (small.size > MAX_BYTES) throw new Error("הקובץ גדול מדי (עד 4MB). נסה לצלם את התלוש במקום להעלות את הקובץ.");
      const body = new FormData();
      body.append("file", small);
      const res = await fetch("/api/payslip", { method: "POST", body });
      const json = await res.json().catch(() => ({ error: res.status === 413 ? "הקובץ גדול מדי" : "משהו השתבש, נסה שוב" }));
      if (!res.ok) throw new Error(json.error ?? "משהו השתבש");
      saveReport(json.report);
      setState({ s: "done", name: file.name, report: json.report });
    } catch (e) {
      setState({ s: "error", name: file.name, message: e instanceof Error ? e.message : "משהו השתבש" });
    }
  }

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    go([...(e.target.files ?? [])]);
    e.target.value = "";
  };

  const reading = state.s === "reading";

  return (
    <>
      <section
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!reading) go([...(e.dataTransfer.files ?? [])]);
        }}
        className={`flex flex-col items-center gap-3.5 rounded-[18px] border-2 border-dashed px-[18px] py-7 text-center transition-colors ${over ? "border-link bg-ibg" : "border-dash bg-card"}`}
      >
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-ibg text-link"><UploadIcon /></span>
        <span className="text-base font-medium">גרור לכאן או צלם את המסמך</span>
        <div role="radiogroup" aria-label="סוג המסמך" className="flex gap-1.5 rounded-xl bg-soft p-1">
          {KINDS.map(({ k, label }) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} disabled={reading} onClick={() => setKind(k)}
              className={`h-9 rounded-lg px-3.5 text-sm ${kind === k ? "bg-card font-medium text-ink shadow-sm" : "text-muted"}`}>{label}</button>
          ))}
        </div>
        <span className="text-[13px] text-muted">{kind === "106" ? "אפשר כמה טפסים ביחד (מעסיק אחר או שנה אחרת)" : "תלוש שכר אחד"} · PDF או תמונה</span>
        <div className="flex gap-2.5">
          <button type="button" disabled={reading} onClick={() => cameraRef.current?.click()} className="h-11 rounded-xl bg-btn px-[18px] text-[15px] font-medium text-btn-ink disabled:opacity-50">צלם</button>
          <button type="button" disabled={reading} onClick={() => fileRef.current?.click()} className="h-11 rounded-xl border border-border2 bg-card px-[18px] text-[15px] text-ink disabled:opacity-50">בחר קובץ</button>
        </div>
        <input ref={fileRef} type="file" accept={ACCEPT} multiple={kind === "106"} onChange={pick} className="hidden" />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
        <span className="text-[13px] leading-normal text-muted">המסמך נקרא אוטומטית ולא נשמר אצלנו.</span>
      </section>

      {state.s !== "idle" && (
        <section aria-live="polite" className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-card p-3.5">
          <span className="text-[13px] text-muted">הועלה עכשיו</span>
          <span dir="auto" className="truncate text-[15px]">{state.name}</span>

          {state.s === "reading" && (
            <div className="flex flex-col gap-2">
              <span className="text-[15px]">{kind === "106" ? "קורא את הטופס ומחשב את המס" : "קורא את התלוש"}. זה לוקח בערך 10 שניות.</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-track">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-fill" />
              </div>
            </div>
          )}

          {state.s === "error" && <span className="text-[15px] text-rtx">{state.message}</span>}

          {state.s === "done106" && (
            <>
              <span className="text-[15px]">
                זיהינו: <b className="font-semibold">טופס 106, {state.report.years.map((y) => y.year).join(", ")}</b>
                {state.report.refund > 0 && <span className="text-gtx"> · כנראה מגיע לך החזר</span>}
              </span>
              <Link href="/form106" className="flex h-11 items-center justify-center rounded-xl bg-fill text-[15px] font-medium text-bg">פתח את הבדיקה</Link>
            </>
          )}

          {state.s === "done" && (
            <>
              <span className="text-[15px]">
                זיהינו: <b className="font-semibold">תלוש שכר{state.report.month ? `, ${monthName(state.report.month)}` : ""}</b>
              </span>
              <div className="flex gap-2.5">
                <Link href="/payslip" className="flex h-11 flex-1 items-center justify-center rounded-xl bg-fill text-[15px] font-medium text-bg">פתח את הבדיקה</Link>
                <button type="button" onClick={() => setState({ s: "idle" })} className="h-11 rounded-xl border border-border2 bg-card px-4 text-[15px] text-ink">זה משהו אחר</button>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
