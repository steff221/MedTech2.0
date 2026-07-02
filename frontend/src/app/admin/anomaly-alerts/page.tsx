// Страница (Next.js): аларми за аномалии — дел за администратор.
"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { Skeleton } from "@/components/common/Skeleton";
import type { NotificationResponse } from "@/types/api";

function AlertCard({ n }: { n: NotificationResponse }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50/40 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
        <AlertTriangle className="h-5 w-5 text-red-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="font-semibold text-slate-900">{n.title}</h3>
          {!n.read && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
              Ново
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-600">{n.body}</p>
        <p className="mt-2 text-xs text-slate-400">
          {format(parseISO(n.createdAt), "dd.MM.yyyy HH:mm:ss")}
        </p>
      </div>
    </div>
  );
}

export default function AnomalyAlertsPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-anomaly-alerts"],
    queryFn: () => adminService.anomalyAlerts(0, 100),
    refetchInterval: 60_000,
  });

  const alerts = data?.content ?? [];
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Аномалии и безбедносни предупредувања</h1>
          <p className="mt-1 text-sm text-slate-500">
            Автоматски детектирани аномалии — освежува на секои 60 секунди.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Освежи
        </button>
      </div>

      {unread > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {unread} непрочитан{unread === 1 ? "" : "и"} предупредувањ{unread === 1 ? "е" : "а"}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <AlertTriangle className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-800">Нема детектирани аномалии</h3>
          <p className="mt-1 text-sm text-slate-500">Системот е во нормала. Последно скенирање: пред помалку од 15 мин.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((n) => <AlertCard key={n.id} n={n} />)}
        </div>
      )}
    </div>
  );
}
