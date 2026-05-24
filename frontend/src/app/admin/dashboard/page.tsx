"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Stethoscope, FileText, ArrowRightLeft } from "lucide-react";
import { statsService } from "@/services/stats.service";
import { Skeleton } from "@/components/common/Skeleton";

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
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
    </div>
  );
}

// ─── Horizontal bar chart (CSS-only) ──────────────────────────────────────────
function BarChart({
  title,
  data,
  labelKey,
  valueKey,
  color,
}: {
  title: string;
  data: Record<string, unknown>[] | undefined;
  labelKey: string;
  valueKey: string;
  color: string;
}) {
  const max = data ? Math.max(...data.map((d) => d[valueKey] as number), 1) : 1;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
      {!data ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8" />)}
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
                  <span className="truncate">{row[labelKey] as string}</span>
                  <span className="ml-2 font-semibold">{row[valueKey] as number}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["stats-overview"],
    queryFn: statsService.overview,
    refetchInterval: 60_000,
  });

  const hospitalData = data?.appointmentsByHospital?.map((h) => ({
    label: `${h.hospital}, ${h.city}`,
    count: h.count,
  }));

  const prescriptionData = data?.prescriptionsByDay?.map((d) => ({
    label: d.day,
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Преглед на системот</h1>
        <p className="mt-1 text-sm text-slate-500">
          Живи статистики — освежува на секои 60 секунди.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Активни пациенти" value={data?.activePatients} icon={Users}          color="bg-violet-100 text-violet-600" />
        <KpiCard label="Активни доктори"  value={data?.activeDoctors}  icon={Stethoscope}    color="bg-sky-100 text-sky-600" />
        <KpiCard label="Рецепти денес"    value={data?.prescriptionsToday} icon={FileText}   color="bg-emerald-100 text-emerald-600" />
        <KpiCard label="Упатувања денес"  value={data?.referralsToday}  icon={ArrowRightLeft} color="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart
          title="Термини по болница (денес)"
          data={hospitalData}
          labelKey="label"
          valueKey="count"
          color="bg-violet-500"
        />
        <BarChart
          title="Рецепти по ден (последни 7 дена)"
          data={prescriptionData}
          labelKey="label"
          valueKey="count"
          color="bg-emerald-500"
        />
      </div>
    </div>
  );
}
