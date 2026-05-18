"use client";

import { motion } from "framer-motion";

interface Datum {
  label: string;
  sub?: string;
  value: number;
}

interface BarChartProps {
  title: string;
  subtitle?: string;
  data: Datum[];
  /** Color stops for the bar gradient — left-to-right */
  gradient?: [string, string];
  /** "horizontal" stacks rows; "vertical" is column bars side-by-side */
  orientation?: "horizontal" | "vertical";
}

export function BarChart({
  title,
  subtitle,
  data,
  gradient = ["#7c3aed", "#06b6d4"],
  orientation = "horizontal",
}: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-white/90">{title}</h3>
        {subtitle && <p className="text-[10px] uppercase tracking-wider text-white/40">{subtitle}</p>}
      </div>

      {orientation === "horizontal" ? (
        <ul className="space-y-3">
          {data.map((d, i) => (
            <li key={d.label + i} className="flex items-center gap-3 text-xs">
              <div className="w-28 shrink-0 truncate text-white/70" title={d.label}>
                {d.label}
              </div>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.value / max) * 100}%` }}
                  transition={{
                    duration: 0.9,
                    delay: i * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`,
                    boxShadow: `0 0 12px ${gradient[1]}55`,
                  }}
                />
              </div>
              <div className="w-10 text-right font-mono tabular-nums text-white/80">
                {d.value}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex h-44 items-end gap-2">
          {data.map((d, i) => (
            <div key={d.label + i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-full w-full items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.value / max) * 100}%` }}
                  transition={{
                    duration: 0.9,
                    delay: i * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="w-full rounded-t-md"
                  style={{
                    background: `linear-gradient(180deg, ${gradient[1]}, ${gradient[0]})`,
                    boxShadow: `0 0 12px ${gradient[1]}55`,
                  }}
                />
              </div>
              <div className="text-center">
                <p className="font-mono text-[11px] tabular-nums text-white/80">{d.value}</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/40">{d.label}</p>
                {d.sub && <p className="text-[9px] text-white/30">{d.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
