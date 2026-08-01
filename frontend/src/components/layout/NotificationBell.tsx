// React компонента: ѕвонче со известувања.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellDot, CheckCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import type { NotificationResponse } from "@/types/api";

function relativeTime(iso: string, t: ReturnType<typeof useT>["doctorNotifBell"]): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 2) return t.justNow;
  if (mins < 60) return `${mins} ${t.minutesAgo}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${t.hoursAgo}`;
  return `${Math.floor(hrs / 24)} ${t.daysAgo}`;
}

function typeColor(type: string): string {
  if (type === "ANOMALY") return "chip-alert";
  if (type === "APPOINTMENT_REMINDER") return "chip-info";
  if (type === "APPOINTMENT_CANCELLED") return "chip-wait";
  return "chip-mute";
}

export function NotificationBell() {
  const t = useT();
  const nt = t.doctorNotifBell;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => notificationService.unreadCount(),
    refetchInterval: 60_000,
  });

  const { data: page } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list(0, 10),
    enabled: open,
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
    },
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const notifications: NotificationResponse[] = page?.content ?? [];
  const hasUnread = unread > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-7 w-7 items-center justify-center rounded-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        aria-label={nt.title}
      >
        {hasUnread ? (
          <BellDot className="h-4 w-4 text-emerald-600" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-sm bg-rose-500 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-9 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className="text-sm font-semibold text-slate-800">{nt.title}</span>
              <div className="flex items-center gap-1">
                {hasUnread && (
                  <button
                    type="button"
                    onClick={() => markAll.mutate()}
                    disabled={markAll.isPending}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    title={nt.markAllRead}
                  >
                    <CheckCheck className="h-3 w-3" /> {nt.markAllRead}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">{nt.empty}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{nt.emptyDesc}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 border-b border-slate-50 px-4 py-3 transition-colors last:border-0",
                      n.read ? "bg-white" : "bg-emerald-50/50",
                    )}
                  >
                    <span
                      className={cn(
                        "chip mt-0.5 shrink-0 !text-[9px]",
                        typeColor(n.type),
                      )}
                    >
                      {n.type.replace(/_/g, " ")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 text-xs text-slate-500 leading-snug line-clamp-2">{n.body}</p>
                      )}
                      <p className="mt-1 text-[10px] text-slate-400">{relativeTime(n.createdAt, nt)}</p>
                    </div>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markOne.mutate(n.id)}
                        className="mt-0.5 shrink-0 rounded p-0.5 text-slate-300 hover:text-emerald-600"
                        title={nt.markAllRead}
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-4 py-2">
              <Link
                href="/doctor/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                {nt.viewAll}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
