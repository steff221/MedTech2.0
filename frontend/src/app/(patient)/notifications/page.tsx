"use client";

import { motion } from "framer-motion";
import { Bell, CheckCircle, Clock, Info, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { useT } from "@/hooks/useT";
import { notificationService } from "@/services/notification.service";
import { cn } from "@/utils/cn";
import type { NotificationResponse } from "@/types/api";

type NotifKind = "REMINDER" | "CANCELLED" | "COMPLETED" | "SYSTEM" | string;

const kindMeta: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  REMINDER:  { icon: Clock,       color: "text-brand-600",   bg: "bg-brand-50"   },
  CANCELLED: { icon: XCircle,     color: "text-rose-500",    bg: "bg-rose-50"    },
  COMPLETED: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  SYSTEM:    { icon: Info,        color: "text-slate-500",   bg: "bg-slate-100"  },
};

function metaFor(type: string) {
  return kindMeta[type] ?? kindMeta.SYSTEM;
}

export default function NotificationsPage() {
  const t = useT();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list(),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const notifications = data?.content ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{t.notifications.title}</h1>
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">{t.notifications.subtitle}</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t.notifications.markAllRead}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title={t.notifications.emptyTitle}
          description={t.notifications.emptyDesc}
          action={
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Bell className="h-7 w-7 text-slate-400" />
            </div>
          }
        />
      ) : (
        <motion.ul
          className="space-y-2"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {notifications.map((notif: NotificationResponse) => {
            const meta = metaFor(notif.type);
            const Icon = meta.icon;
            const date = parseISO(notif.createdAt);

            return (
              <motion.li
                key={notif.id}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } }}
                onClick={() => { if (!notif.read) markRead.mutate(notif.id); }}
                className={cn(
                  "flex cursor-pointer gap-4 rounded-xl border bg-white p-4 shadow-sm transition-colors hover:bg-slate-50",
                  notif.read ? "border-slate-200" : "border-brand-200",
                )}
              >
                <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", meta.bg)}>
                  <Icon className={cn("h-4 w-4", meta.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-semibold", notif.read ? "text-slate-700" : "text-slate-900")}>
                      {notif.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-400">{format(date, "d MMM")}</span>
                      {!notif.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                    </div>
                  </div>
                  {notif.body && <p className="mt-0.5 text-sm text-slate-500">{notif.body}</p>}
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
