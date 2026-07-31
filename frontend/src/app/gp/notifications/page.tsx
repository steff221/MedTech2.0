// Страница (Next.js): известувања — дел за матичен лекар (GP).
"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PageBanner } from "@/components/layout/PageBanner";
import { Card } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { notificationService } from "@/services/notification.service";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";

function typeColor(type: string) {
  if (type === "ANOMALY") return "bg-rose-100 text-rose-700";
  if (type === "APPOINTMENT_REMINDER") return "bg-blue-100 text-blue-700";
  if (type === "APPOINTMENT_CANCELLED") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function DoctorNotificationsPage() {
  const t = useT();
  const nt = t.notifications;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list(0, 50),
  });

  const markOne = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
      toast.success(nt.markAllRead);
    },
  });

  const notifications = data?.content ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <PageBanner
        title={nt.title}
        breadcrumb={[{ label: nt.title }]}
        actions={
          unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30"
            >
              <CheckCheck className="h-4 w-4" />
              {nt.markAllRead}
            </button>
          )
        }
      />

      <div className="mx-auto max-w-3xl px-6 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <Bell className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm font-medium text-slate-500">{nt.emptyTitle}</p>
              <p className="mt-1 text-xs text-slate-400">{nt.emptyDesc}</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 rounded-xl border px-5 py-4 transition-colors",
                  n.read
                    ? "border-slate-200 bg-white"
                    : "border-emerald-200 bg-emerald-50/60",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    typeColor(n.type),
                  )}
                >
                  {n.type.replace(/_/g, " ")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>}
                  <p className="mt-1.5 text-xs text-slate-400">
                    {formatDate(n.createdAt, "d MMM yyyy · HH:mm")}
                  </p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markOne.mutate(n.id)}
                    className="mt-0.5 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-emerald-600"
                    title={t.notifications.markAllRead}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
