// React компонента: анимиран бројач (KPI) на почетната страница.
"use client";

import { useEffect, useRef, useState } from "react";

interface KpiCounterProps {
  value: number;
  label: string;
  sub?: string;
  durationMs?: number;
  dark?: boolean;
}

// easeOutCubic — fast start, gentle settle
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function KpiCounter({
  value,
  label,
  sub,
  durationMs = 1400,
  dark = false,
}: KpiCounterProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const target = value;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      setDisplay(Math.round(target * ease(t)));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]);

  return (
    <div className={`rounded-2xl border p-5 ${dark ? "border-white/10 bg-white/[0.03] backdrop-blur-sm" : "border-gray-200 bg-white shadow-sm"}`}>
      <p className={`text-xs ${dark ? "text-white/50" : "text-gray-500"}`}>{label}</p>
      <p className={`mt-2 text-4xl font-bold tabular-nums ${dark ? "text-white" : "text-gray-900"}`}>
        {display.toLocaleString()}
      </p>
      {sub && <p className={`mt-1 text-xs ${dark ? "text-white/40" : "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}
