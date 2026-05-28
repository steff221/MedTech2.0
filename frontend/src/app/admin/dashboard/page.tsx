"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft, FileText, Stethoscope, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { mk as mkLocale } from "date-fns/locale";
import { statsService } from "@/services/stats.service";
import { Skeleton } from "@/components/common/Skeleton";
import { cn } from "@/utils/cn";

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, icon: Icon, color, delay,
}: {
  label: string; value: number | undefined;
  icon: React.ElementType; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        {value === undefined ? (
          <Skeleton className="mt-1 h-7 w-16" />
        ) : (
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Area / Sparkline chart ────────────────────────────────────────────────────
function AreaChart({
  title, data, color, gradientId,
}: {
  title: string;
  data: Array<{ day: string; count: number }> | undefined;
  color: string;
  gradientId: string;
}) {
  const W = 400; const H = 100; const PAD = 8;

  const points = data ?? [];
  const max = Math.max(1, ...points.map((d) => d.count));

  const xs = points.map((_, i) =>
    points.length < 2 ? W / 2 : PAD + (i / (points.length - 1)) * (W - PAD * 2),
  );
  const ys = points.map((d) => PAD + (1 - d.count / max) * (H - PAD * 2));

  const polyline = points.map((_, i) => `${xs[i]},${ys[i]}`).join(" ");
  const area = points.length
    ? `M ${xs[0]},${H} ` +
      points.map((_, i) => `L ${xs[i]},${ys[i]}`).join(" ") +
      ` L ${xs[xs.length - 1]},${H} Z`
    : "";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-400">Последни 7 дена</p>
      </div>
      <div className="px-5 py-4">
        {!data ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
              style={{ height: 110 }}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <motion.path
                d={area}
                fill={`url(#${gradientId})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              />
              <motion.polyline
                points={polyline}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              {points.map((d, i) => (
                <circle key={i} cx={xs[i]} cy={ys[i]} r="3.5" fill={color} opacity={0.85} />
              ))}
            </svg>
            {/* X-axis labels */}
            <div className="mt-1 flex justify-between">
              {points.map((d, i) => (
                <span key={i} className="text-[9px] text-slate-400">
                  {format(parseISO(d.day), "d MMM", { locale: mkLocale })}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Column bar chart ──────────────────────────────────────────────────────────
function ColumnChart({
  title, subtitle, data, labelKey, valueKey, color,
}: {
  title: string; subtitle?: string;
  data: Record<string, unknown>[] | undefined;
  labelKey: string; valueKey: string; color: string;
}) {
  const max = data ? Math.max(1, ...data.map((d) => d[valueKey] as number)) : 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="px-5 py-5">
        {!data ? (
          <Skeleton className="h-36 w-full" />
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Нема податоци</p>
        ) : (
          <div className="flex h-36 items-end gap-2">
            {data.map((row, i) => {
              const pct = ((row[valueKey] as number) / max) * 100;
              return (
                <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {row[valueKey] as number}
                  </span>
                  <div className="flex w-full items-end justify-center" style={{ height: 110 }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.06, ease: "easeOut" }}
                      className={cn("w-full rounded-t-lg", color)}
                      style={{ minHeight: 4 }}
                    />
                  </div>
                  <p className="truncate text-center text-[9px] text-slate-400 max-w-full px-0.5" title={row[labelKey] as string}>
                    {(row[labelKey] as string).length > 10
                      ? (row[labelKey] as string).slice(0, 9) + "…"
                      : row[labelKey] as string}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Horizontal bar chart ──────────────────────────────────────────────────────
function HBarChart({
  title, subtitle, data, labelKey, valueKey, color,
}: {
  title: string; subtitle?: string;
  data: Record<string, unknown>[] | undefined;
  labelKey: string; valueKey: string; color: string;
}) {
  const max = data ? Math.max(1, ...data.map((d) => d[valueKey] as number)) : 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="px-5 py-4">
        {!data ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)}
          </div>
        ) : data.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Нема податоци</p>
        ) : (
          <div className="space-y-3">
            {data.map((row, i) => {
              const pct = Math.round(((row[valueKey] as number) / max) * 100);
              return (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span className="truncate max-w-[180px]">{row[labelKey] as string}</span>
                    <span className="ml-2 font-semibold tabular-nums">{row[valueKey] as number}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.07, ease: "easeOut" }}
                      className={cn("h-full rounded-full", color)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["stats-overview"],
    queryFn: statsService.overview,
    refetchInterval: 60_000,
  });

  const hospitalData = data?.appointmentsByHospital?.map((h) => ({
    label: `${h.hospital}`,
    count: h.count,
  }));

  const prescriptionData = data?.prescriptionsByDay?.map((d) => ({
    day: d.day,
    count: d.count,
  }));

  const appointmentData = data?.appointmentsByDay?.map((d) => ({
    day: d.day,
    count: d.count,
  }));

  const specData = data?.topSpecializations?.map((s) => ({
    label: s.specialization,
    count: s.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Преглед на системот</h1>
        <p className="mt-1 text-sm text-slate-500">
          Живи статистики — освежува на секои 60 секунди.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Активни пациенти" value={data?.activePatients}     icon={Users}          color="bg-violet-100 text-violet-600" delay={0}    />
        <KpiCard label="Активни доктори"  value={data?.activeDoctors}      icon={Stethoscope}    color="bg-sky-100 text-sky-600"       delay={0.05} />
        <KpiCard label="Рецепти денес"    value={data?.prescriptionsToday} icon={FileText}       color="bg-emerald-100 text-emerald-600" delay={0.1} />
        <KpiCard label="Термини денес"    value={data?.referralsToday}     icon={ArrowRightLeft} color="bg-amber-100 text-amber-600"   delay={0.15} />
      </div>

      {/* Trend charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
          <AreaChart
            title="Термини по ден"
            data={appointmentData}
            color="#6366f1"
            gradientId="appt-gradient"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
          <AreaChart
            title="Рецепти по ден"
            data={prescriptionData}
            color="#10b981"
            gradientId="rx-gradient"
          />
        </motion.div>
      </div>

      {/* Bar charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }}>
          <ColumnChart
            title="Топ специјализации"
            subtitle="Број на активни доктори"
            data={specData}
            labelKey="label"
            valueKey="count"
            color="bg-violet-400"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.35 }}>
          <HBarChart
            title="Термини по болница"
            subtitle="Последни 30 дена"
            data={hospitalData}
            labelKey="label"
            valueKey="count"
            color="bg-sky-500"
          />
        </motion.div>
      </div>
    </div>
  );
}
