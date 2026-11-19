import { useEffect, useState } from "react";

export type SlaTone = "ok" | "warn" | "breach" | "none";

/** Alert SLA window assumed for gauge fill (visual only; API has no start time). */
export const SLA_WINDOW_MS = 4 * 3_600_000;
export const SLA_WARN_MS = 30 * 60_000;

export function slaTone(dueAt: string | null, now: number): SlaTone {
  if (!dueAt) return "none";
  const ms = new Date(dueAt).getTime() - now;
  if (ms < 0) return "breach";
  if (ms < SLA_WARN_MS) return "warn";
  return "ok";
}

/** 0–1 share of the assumed SLA window still left (clamped). */
export function slaLeft(dueAt: string | null, now: number): number {
  if (!dueAt) return 1;
  const ms = new Date(dueAt).getTime() - now;
  return Math.max(0, Math.min(1, ms / SLA_WINDOW_MS));
}

export function formatClock(ms: number): string {
  const abs = Math.abs(ms);
  const totalSec = Math.floor(abs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Re-render every `ms` with a fresh epoch. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}
