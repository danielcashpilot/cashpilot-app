"use client";
import { useSyncExternalStore } from "react";
import type { Report106 } from "./check";

// Like the payslip: the last 106 check lives in this browser tab only.
const KEY = "cashpilot.last106";

export function save106(r: Report106) {
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

export function useSaved106(): Report106 | null {
  const raw = useSyncExternalStore(() => () => {}, read, () => null);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Report106;
  } catch {
    return null;
  }
}
