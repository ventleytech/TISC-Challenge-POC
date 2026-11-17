import { useEffect, useState } from "react";

type SlaCountdownProps = {
  dueAt: string | null;
};

function formatRemaining(ms: number): string {
  const breached = ms < 0;
  const abs = Math.abs(ms);
  const totalSec = Math.floor(abs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const clock =
    h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;
  return breached ? `breached ${clock}` : clock;
}

/** Client-side SLA countdown stub — ticks once per second. */
export function SlaCountdown({ dueAt }: SlaCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!dueAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [dueAt]);

  if (!dueAt) {
    return <span className="sla sla--none">no SLA</span>;
  }

  const remaining = new Date(dueAt).getTime() - now;
  const breached = remaining < 0;

  return (
    <span
      className={`sla${breached ? " sla--breached" : " sla--ok"}`}
      title={new Date(dueAt).toLocaleString()}
    >
      {formatRemaining(remaining)}
    </span>
  );
}
