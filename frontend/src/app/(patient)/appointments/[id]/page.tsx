// Страница (Next.js): термини (детал) — дел за пациент.
"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Hospital,
  Star,
  Video,
  X,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { mk as mkLocale } from "date-fns/locale";
import { Badge, appointmentStatusTone } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { StarRating } from "@/components/common/StarRating";
import { RateAppointmentModal } from "@/components/patient/RateAppointmentModal";
import { useT } from "@/hooks/useT";
import { appointmentService } from "@/services/appointment.service";
import { extractErrorMessage } from "@/services/api";
import { formatTime, initials } from "@/utils/format";
import { cn } from "@/utils/cn";
import { useState } from "react";
import type { AppointmentStatus } from "@/types/api";

const APPT_TYPE_MK: Record<string, string> = {
  CONSULTATION: "Консултација",
  FOLLOW_UP:    "Контрола",
  PROCEDURE:    "Процедура",
  CHECKUP:      "Систематски",
  VIRTUAL:      "Виртуелен",
  EMERGENCY:    "Итен случај",
};

const STATUS_META: Record<AppointmentStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  SCHEDULED:   { label: "Закажан",    icon: Calendar,      color: "text-brand-700",   bg: "bg-brand-50 border-brand-200"   },
  RESCHEDULED: { label: "Преместен",  icon: RefreshCw,     color: "text-violet-700",  bg: "bg-violet-50 border-violet-200" },
  COMPLETED:   { label: "Завршен",    icon: CheckCircle2,  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  CANCELLED:   { label: "Откажан",    icon: XCircle,       color: "text-rose-700",    bg: "bg-rose-50 border-rose-200"     },
  NO_SHOW:     { label: "Не се јави", icon: AlertCircle,   color: "text-amber-700",   bg: "bg-amber-50 border-amber-200"   },
};

export default function AppointmentDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [ratingOpen, setRatingOpen] = useState(false);

  const { data: appt, isLoading } = useQuery({
    queryKey: ["appointment", Number(id)],
    queryFn: () => appointmentService.getById(Number(id)),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => appointmentService.cancel(Number(id), "Откажано од пациентот"),
    onSuccess: () => {
      toast.success(t.appointments.cancelSuccess);
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointment", Number(id)] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-slate-500">Прегледот не е пронајден.</p>
        <Link href="/appointments" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          Назад кон прегледи
        </Link>
      </div>
    );
  }

  const isTerminal = appt.status === "CANCELLED" || appt.status === "COMPLETED" || appt.status === "NO_SHOW";
  const canRate = appt.status === "COMPLETED" && appt.ratingId == null;
  const statusMeta = STATUS_META[appt.status] ?? STATUS_META.SCHEDULED;
  const StatusIcon = statusMeta.icon;

  const [docFirst, ...rest] = appt.doctorName.split(" ");
  const docLast = rest.join(" ") || "";

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-5">

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </button>
        </motion.div>

        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn("flex items-center gap-3 rounded-2xl border px-5 py-4", statusMeta.bg)}
        >
          <StatusIcon className={cn("h-5 w-5 shrink-0", statusMeta.color)} />
          <div className="flex-1">
            <p className={cn("font-semibold", statusMeta.color)}>{statusMeta.label}</p>
            {appt.cancellationReason && (
              <p className="mt-0.5 text-xs text-rose-500">{appt.cancellationReason}</p>
            )}
          </div>
          <Badge tone={appointmentStatusTone(appt.status)}>{statusMeta.label}</Badge>
        </motion.div>

        {/* Doctor card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-lg font-bold text-brand-700">
              {initials(docFirst, docLast)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-slate-900">{appt.doctorName}</p>
              {appt.doctorSpecialization && (
                <p className="text-sm text-slate-500">{appt.doctorSpecialization}</p>
              )}
              {appt.hospitalName && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <Hospital className="h-3.5 w-3.5" />
                  {appt.hospitalName}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Details grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-3.5">
            <p className="text-sm font-semibold text-slate-900">Детали за прегледот</p>
          </div>
          <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-slate-100">
            <DetailCell
              icon={Calendar}
              label="Датум"
              value={format(parseISO(appt.appointmentDate), "d MMMM yyyy", { locale: mkLocale })}
            />
            <DetailCell
              icon={Clock}
              label="Час"
              value={`${formatTime(appt.appointmentTime)} · ${appt.durationMinutes} мин.`}
            />
            <DetailCell
              icon={FileText}
              label="Тип"
              value={APPT_TYPE_MK[appt.appointmentType ?? ""] ?? appt.appointmentType ?? "—"}
            />
            <DetailCell
              icon={Calendar}
              label="Закажано на"
              value={format(parseISO(appt.createdAt), "d MMM yyyy", { locale: mkLocale })}
            />
            {appt.reason && (
              <div className="col-span-2 px-5 py-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Причина</p>
                <p className="text-sm text-slate-700">{appt.reason}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Video call */}
        {appt.appointmentType === "VIRTUAL" && appt.videoCallUrl && !isTerminal && (
          <motion.a
            href={appt.videoCallUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 transition-colors hover:bg-emerald-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">Приклучи се на видео-повик</p>
              <p className="text-xs text-emerald-600">Кликни за да отвориш Jitsi Meet</p>
            </div>
          </motion.a>
        )}

        {/* Rating */}
        {appt.status === "COMPLETED" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 px-5 py-3.5">
              <p className="text-sm font-semibold text-slate-900">Оценка</p>
            </div>
            <div className="px-5 py-4">
              {canRate ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Оценете го овој преглед</p>
                  <Button size="sm" onClick={() => setRatingOpen(true)}>
                    <Star className="h-3.5 w-3.5" />
                    Оцени
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <StarRating value={appt.ratingValue ?? 0} readonly size="md" />
                  <span className="text-sm text-slate-500">{appt.ratingValue?.toFixed(1)} / 5</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {!isTerminal && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex gap-3"
          >
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              <X className="h-4 w-4" />
              Откажи преглед
            </Button>
          </motion.div>
        )}

      </div>

      <RateAppointmentModal
        appointmentId={appt.id}
        doctorName={appt.doctorName}
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
      />
    </>
  );
}

function DetailCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      </div>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
