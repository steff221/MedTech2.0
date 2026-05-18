"use client";

import { useEffect, useRef, useState } from "react";

interface KpiCounterProps {
  value: number;
  label: string;
  sub?: string;
  durationMs?: number;
  accent?: "teal" | "violet";
}

// easeOutCubic — fast start, gentle settle
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function KpiCounter({
  value,
  label,
  sub,
  durationMs = 1400,
  accent = "teal",
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

  const accentClass =
    accent === "violet"
      ? "from-violet-400 via-fuchsia-400 to-cyan-300"
      : "from-cyan-300 via-teal-300 to-emerald-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>
      <p
        className={`mt-2 bg-gradient-to-r bg-clip-text text-5xl font-bold tabular-nums text-transparent ${accentClass}`}
      >
        {display.toLocaleString()}
      </p>
      {sub && <p className="mt-1 text-xs text-white/40">{sub}</p>}
    </div>
  );
}
