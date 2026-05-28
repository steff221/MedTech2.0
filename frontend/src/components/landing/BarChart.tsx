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
  gradient?: [string, string];
  orientation?: "horizontal" | "vertical";
  dark?: boolean;
}

export function BarChart({
  title,
  subtitle,
  data,
  gradient = ["#7c3aed", "#06b6d4"],
  orientation = "horizontal",
  dark = false,
}: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className={`rounded-2xl border p-5 ${dark ? "border-white/10 bg-white/[0.03] backdrop-blur-sm" : "border-gray-200 bg-white shadow-sm"}`}>
      <div className="mb-5 flex items-baseline justify-between">
        <h3 className={`text-sm font-semibold ${dark ? "text-white/90" : "text-gray-900"}`}>{title}</h3>
        {subtitle && <p className={`text-[10px] uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-400"}`}>{subtitle}</p>}
      </div>

      {orientation === "horizontal" ? (
        <ul className="space-y-3">
          {data.map((d, i) => (
            <li key={d.label + i} className="flex items-center gap-3 text-xs">
              <div className={`w-28 shrink-0 truncate ${dark ? "text-white/70" : "text-gray-600"}`} title={d.label}>
                {d.label}
              </div>
              <div className={`relative h-2 flex-1 overflow-hidden rounded-full ${dark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.value / max) * 100}%` }}
                  transition={{ duration: 0.9, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})` }}
                />
              </div>
              <div className={`w-10 text-right font-mono tabular-nums ${dark ? "text-white/80" : "text-gray-700"}`}>
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
                  transition={{ duration: 0.9, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full rounded-t-md"
                  style={{ background: `linear-gradient(180deg, ${gradient[1]}, ${gradient[0]})` }}
                />
              </div>
              <div className="text-center">
                <p className={`font-mono text-[11px] tabular-nums ${dark ? "text-white/80" : "text-gray-700"}`}>{d.value}</p>
                <p className={`mt-0.5 text-[9px] uppercase tracking-wider ${dark ? "text-white/40" : "text-gray-400"}`}>{d.label}</p>
                {d.sub && <p className={`text-[9px] ${dark ? "text-white/30" : "text-gray-400"}`}>{d.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
