"use client";
import { useSyncExternalStore } from "react";
import type { Report } from "./rules";

// The demo has no database: the last checked payslip lives in this browser
// tab only (sessionStorage), and is gone when the tab closes.
const KEY = "cashpilot.lastPayslip";

export function saveReport(r: Report) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(r));
  } catch {}
}

const read = () => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function useSavedReport(): Report | null {
  const raw = useSyncExternalStore(
    () => () => {},
    read,
    () => null,
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Report;
  } catch {
    return null;
  }
}

const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
export function monthName(ym: string | null): string | null {
  const m = ym?.match(/^(\d{4})-(\d{2})$/);
  if (!m) return ym;
  const i = Number(m[2]) - 1;
  return MONTHS[i] ? `${MONTHS[i]} ${m[1]}` : ym;
}
