// Страница (Next.js): ревизорски логови — дел за администратор.
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Search, ShieldCheck, ShieldX } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { Skeleton } from "@/components/common/Skeleton";
import { Badge } from "@/components/common/Badge";
import type { AuditLogResponse } from "@/types/api";

const ACTION_TONE: Record<string, "info" | "success" | "warning" | "neutral"> = {
  LOGIN:  "success",
  LOGOUT: "neutral",
  INSERT: "info",
  UPDATE: "warning",
  DELETE: "warning",
  VIEW:   "neutral",
};

function AuditRow({ row }: { row: AuditLogResponse }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-2.5 text-xs text-slate-400 font-mono whitespace-nowrap">
        {format(parseISO(row.createdAt), "dd.MM.yyyy HH:mm:ss")}
      </td>
      <td className="px-4 py-2.5 text-sm text-slate-700">{row.userId ?? "—"}</td>
      <td className="px-4 py-2.5">
        <Badge tone={ACTION_TONE[row.actionType] ?? "neutral"} className="text-xs">
          {row.actionType}
        </Badge>
      </td>
      <td className="px-4 py-2.5 text-sm text-slate-600">{row.entityType ?? "—"}</td>
      <td className="px-4 py-2.5 text-sm text-slate-600">{row.entityId ?? "—"}</td>
      <td className="px-4 py-2.5 text-sm text-slate-600 max-w-xs truncate">{row.description ?? "—"}</td>
      <td className="px-4 py-2.5">
        {row.status === "SUCCESS"
          ? <ShieldCheck className="h-4 w-4 text-emerald-500" />
          : <ShieldX className="h-4 w-4 text-red-500" />}
      </td>
      <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{row.ipAddress ?? "—"}</td>
    </tr>
  );
}

export default function AuditLogsPage() {
  const [userIdInput, setUserIdInput] = useState("");
  const [entityTypeInput, setEntityTypeInput] = useState("");
  const [committed, setCommitted] = useState<{ userId?: number; entityType?: string }>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", committed],
    queryFn: () => adminService.auditLogs({ ...committed, size: 100 }),
  });

  function search() {
    const userId = userIdInput.trim() ? Number(userIdInput.trim()) : undefined;
    const entityType = entityTypeInput.trim() || undefined;
    setCommitted({ userId, entityType });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ревизорски дневник</h1>
        <p className="mt-1 text-sm text-slate-500">
          Пребарај по корисник или тип на ентитет. Без филтер се прикажани последните записи.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            ID на корисник
          </label>
          <input
            type="number"
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="пр. 42"
            className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Тип на ентитет
          </label>
          <input
            type="text"
            value={entityTypeInput}
            onChange={(e) => setEntityTypeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Patient, Appointment…"
            className="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
        <button
          onClick={search}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Search className="h-4 w-4" />
          Пребарај
        </button>
        {(committed.userId || committed.entityType) && (
          <button
            onClick={() => { setUserIdInput(""); setEntityTypeInput(""); setCommitted({}); }}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Ресетирај
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Време</th>
                <th className="px-4 py-3">ID на корисник</th>
                <th className="px-4 py-3">Акција</th>
                <th className="px-4 py-3">Ентитет</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Опис</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.content.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                      Нема пронајдени записи.
                    </td>
                  </tr>
                )
                : data?.content.map((row) => <AuditRow key={row.id} row={row} />)
              }
            </tbody>
          </table>
        </div>
        {data && (
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            Прикажани {data.content.length} од {data.totalElements} записи
          </div>
        )}
      </div>
    </div>
  );
}
