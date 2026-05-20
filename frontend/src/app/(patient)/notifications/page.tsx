"use client";

import { motion } from "framer-motion";
import { Bell, CheckCircle, Clock, Info, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, parseISO, isToday, isTomorrow } from "date-fns";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { usePatientProfile } from "@/hooks/usePatient";
import { useT } from "@/hooks/useT";
import { patientService } from "@/services/patient.service";
import { cn } from "@/utils/cn";
import type { AppointmentResponse } from "@/types/api";

type NotifKind = "reminder" | "cancelled" | "completed" | "system";

interface Notification {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

const kindMeta: Record<NotifKind, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  reminder:  { icon: Clock,       color: "text-brand-600",   bg: "bg-brand-50"    },
  cancelled: { icon: XCircle,     color: "text-rose-500",    bg: "bg-rose-50"     },
  completed: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50"  },
  system:    { icon: Info,        color: "text-slate-500",   bg: "bg-slate-100"   },
};

export default function NotificationsPage() {
  const profile = usePatientProfile();
  const t = useT();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", profile.data?.id],
    queryFn: () => patientService.appointments(profile.data!.id),
    enabled: !!profile.data?.id,
  });

  const notifications = useMemo(() => {
    function toNotif(apt: AppointmentResponse): Notification | null {
      const date = parseISO(apt.appointmentDate as unknown as string);
      const daysAway = differenceInDays(date, new Date());

      if (apt.status === "SCHEDULED" || apt.status === "RESCHEDULED") {
        if (daysAway < 0 || daysAway > 7) return null;
        let when = `на ${format(date, "d MMM")} во ${apt.appointmentTime}`;
        if (isToday(date))    when = `денес во ${apt.appointmentTime}`;
        if (isTomorrow(date)) when = `утре во ${apt.appointmentTime}`;
        return {
          id: `reminder-${apt.id}`,
          kind: "reminder",
          title: t.notifications.reminder,
          body: `${t.notifications.reminder}: ${when} — д-р ${apt.doctorName ?? "—"}.`,
          timestamp: date,
          read: false,
        };
      }
      if (apt.status === "CANCELLED") {
        return {
          id: `cancelled-${apt.id}`,
          kind: "cancelled",
          title: t.notifications.cancelledKind,
          body: `${format(date, "d MMM yyyy")} — д-р ${apt.doctorName ?? "—"}`,
          timestamp: date,
          read: true,
        };
      }
      if (apt.status === "COMPLETED") {
        return {
          id: `completed-${apt.id}`,
          kind: "completed",
          title: t.notifications.completedKind,
          body: `${format(date, "d MMM yyyy")} — д-р ${apt.doctorName ?? "—"}`,
          timestamp: date,
          read: true,
        };
      }
      return null;
    }

    const systemNotifs: Notification[] = [
      {
        id: "sys-welcome",
        kind: "system",
        title: t.notifications.systemWelcomeTitle,
        body: t.notifications.systemWelcomeBody,
        timestamp: new Date(2026, 0, 1),
        read: true,
      },
    ];

    const apptNotifs = (appointmentsQuery.data?.content ?? [])
      .map(toNotif)
      .filter((n): n is Notification => n !== null);

    return [...apptNotifs, ...systemNotifs].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }, [appointmentsQuery.data, t]);

  const isLoading = profile.isLoading || appointmentsQuery.isLoading;
  const unreadCount = notifications.filter((n) => !n.read && !readIds.has(n.id)).length;

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
            onClick={() => setReadIds(new Set(notifications.map((n) => n.id)))}
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
          {notifications.map((notif) => {
            const isRead = notif.read || readIds.has(notif.id);
            const meta = kindMeta[notif.kind];
            const Icon = meta.icon;

            return (
              <motion.li
                key={notif.id}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } }}
                onClick={() => setReadIds((prev) => new Set([...prev, notif.id]))}
                className={cn(
                  "flex cursor-pointer gap-4 rounded-xl border bg-white p-4 shadow-sm transition-colors hover:bg-slate-50",
                  isRead ? "border-slate-200" : "border-brand-200",
                )}
              >
                <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", meta.bg)}>
                  <Icon className={cn("h-4 w-4", meta.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-semibold", isRead ? "text-slate-700" : "text-slate-900")}>
                      {notif.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-400">{format(notif.timestamp, "d MMM")}</span>
                      {!isRead && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{notif.body}</p>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
