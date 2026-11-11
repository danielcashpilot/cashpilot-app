"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Report } from "@/lib/payslip/rules";
import { monthName, saveReport } from "@/lib/payslip/store";
import { UploadIcon } from "./icons";

type State =
  | { s: "idle" }
  | { s: "reading"; name: string }
  | { s: "done"; name: string; report: Report }
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

export default function UploadBox() {
  const [state, setState] = useState<State>({ s: "idle" });
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

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
    const f = e.target.files?.[0];
    if (f) send(f);
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
          const f = e.dataTransfer.files?.[0];
          if (f && !reading) send(f);
        }}
        className={`flex flex-col items-center gap-3.5 rounded-[18px] border-2 border-dashed px-[18px] py-7 text-center transition-colors ${over ? "border-link bg-ibg" : "border-dash bg-card"}`}
      >
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-ibg text-link"><UploadIcon /></span>
        <span className="text-base font-medium">גרור לכאן או צלם את המסמך</span>
        <span className="text-[13px] text-muted">כרגע תלוש שכר אחד · PDF או תמונה</span>
        <div className="flex gap-2.5">
          <button type="button" disabled={reading} onClick={() => cameraRef.current?.click()} className="h-11 rounded-xl bg-btn px-[18px] text-[15px] font-medium text-btn-ink disabled:opacity-50">צלם</button>
          <button type="button" disabled={reading} onClick={() => fileRef.current?.click()} className="h-11 rounded-xl border border-border2 bg-card px-[18px] text-[15px] text-ink disabled:opacity-50">בחר קובץ</button>
        </div>
        <input ref={fileRef} type="file" accept={ACCEPT} onChange={pick} className="hidden" />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
        <span className="text-[13px] leading-normal text-muted">התלוש נקרא אוטומטית ולא נשמר אצלנו.</span>
      </section>

      {state.s !== "idle" && (
        <section aria-live="polite" className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-card p-3.5">
          <span className="text-[13px] text-muted">הועלה עכשיו</span>
          <span dir="auto" className="truncate text-[15px]">{state.name}</span>

          {state.s === "reading" && (
            <div className="flex flex-col gap-2">
              <span className="text-[15px]">קורא את התלוש. זה לוקח בערך 10 שניות.</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-track">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-fill" />
              </div>
            </div>
          )}

          {state.s === "error" && <span className="text-[15px] text-rtx">{state.message}</span>}

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
