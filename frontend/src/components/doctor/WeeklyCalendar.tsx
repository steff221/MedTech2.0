// React компонента: неделен календар со термини.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { addDays, addWeeks, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, ExternalLink, Link, User, Video, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "@/components/common/Button";
import { Badge, appointmentStatusTone } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { useT } from "@/hooks/useT";
import { appointmentService } from "@/services/appointment.service";
import { doctorService } from "@/services/doctor.service";
import { extractErrorMessage } from "@/services/api";
import { cn } from "@/utils/cn";
import { formatTime } from "@/utils/format";
import type { AppointmentResponse, AppointmentStatus } from "@/types/api";

interface WeeklyCalendarProps {
  doctorId: number;
}

const START_HOUR = 8;
const END_HOUR = 17;
const SLOT_MINUTES = 20;

const SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

function statusBg(status: AppointmentStatus, isVirtual: boolean): string {
  if (isVirtual && (status === "SCHEDULED" || status === "RESCHEDULED")) {
    return "bg-violet-500/90 text-white hover:bg-violet-600";
  }
  switch (status) {
    case "SCHEDULED":   return "bg-emerald-500/90 text-white hover:bg-emerald-600";
    case "COMPLETED":   return "bg-slate-400 text-white hover:bg-slate-500";
    case "RESCHEDULED": return "bg-amber-500 text-white hover:bg-amber-600";
    case "CANCELLED":
    case "NO_SHOW":     return "bg-rose-400 text-white hover:bg-rose-500";
  }
}

export function WeeklyCalendar({ doctorId }: WeeklyCalendarProps) {
  const t = useT();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected]     = useState<AppointmentResponse | null>(null);
  const [videoUrlDraft, setVideoUrlDraft] = useState("");
  const queryClient = useQueryClient();

  const weekStart = useMemo(
    () => addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset),
    [weekOffset],
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const dayQueries = useQueries({
    queries: days.map((d) => {
      const iso = format(d, "yyyy-MM-dd");
      return {
        queryKey: ["appointments", "doctor", doctorId, iso],
        queryFn:  () => doctorService.appointmentsOn(doctorId, iso),
        staleTime: 60 * 1000,
      };
    }),
  });

  const indexed = useMemo(() => {
    const map = new Map<string, Map<string, AppointmentResponse>>();
    dayQueries.forEach((q, i) => {
      const iso = format(days[i], "yyyy-MM-dd");
      const inner = new Map<string, AppointmentResponse>();
      q.data?.content.forEach((apt) => {
        const key = apt.appointmentTime.substring(0, 5);
        const [h, m] = key.split(":").map(Number);
        const snapped = `${String(h).padStart(2, "0")}:${String(Math.floor(m / SLOT_MINUTES) * SLOT_MINUTES).padStart(2, "0")}`;
        inner.set(snapped, apt);
      });
      map.set(iso, inner);
    });
    return map;
  }, [dayQueries, days]);

  const today     = new Date();
  const isLoading = dayQueries.some((q) => q.isLoading);

  const openModal = (apt: AppointmentResponse) => {
    setSelected(apt);
    setVideoUrlDraft(apt.videoCallUrl ?? "");
  };

  const setVideoUrlMutation = useMutation({
    mutationFn: ({ id, url }: { id: number; url: string }) =>
      appointmentService.setVideoUrl(id, url),
    onSuccess: (updated) => {
      setSelected(updated);
      setVideoUrlDraft(updated.videoCallUrl ?? "");
      queryClient.invalidateQueries({
        queryKey: ["appointments", "doctor", doctorId, updated.appointmentDate],
      });
      toast.success(t.doctorSchedule.videoSaved);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const isTerminal = (apt: AppointmentResponse) =>
    apt.status === "CANCELLED" || apt.status === "COMPLETED" || apt.status === "NO_SHOW";

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" /> Претходна
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>
            Денес
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
            Следна <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm font-semibold text-slate-700">
          {format(days[0], "MMM d")} – {format(days[6], "MMM d, yyyy")}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <Legend swatch="bg-emerald-500"  label="Закажан" />
          <Legend swatch="bg-violet-500"   label="Виртуелен" />
          <Legend swatch="bg-amber-500"    label="Преместен" />
          <Legend swatch="bg-rose-400"     label="Откажан" />
          <Legend swatch="bg-slate-400"    label="Завршен" />
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div
          className="grid border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"
          style={{ gridTemplateColumns: "72px repeat(7, minmax(0, 1fr))" }}
        >
          <div className="border-r border-slate-200 px-2 py-3" />
          {days.map((d) => {
            const isToday = isSameDay(d, today);
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  "border-r border-slate-200 px-2 py-3 text-center last:border-r-0",
                  isToday && "bg-brand-50 text-brand-700",
                )}
              >
                <div>{format(d, "EEE")}</div>
                <div className={cn("mt-0.5 text-base font-bold text-slate-900", isToday && "text-brand-700")}>
                  {format(d, "d")}
                </div>
              </div>
            );
          })}
        </div>

        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          {SLOTS.map((slot) => (
            <div
              key={slot}
              className="grid border-b border-slate-100 last:border-b-0"
              style={{ gridTemplateColumns: "72px repeat(7, minmax(0, 1fr))" }}
            >
              <div className="border-r border-slate-200 px-2 py-1.5 text-right text-[11px] font-medium text-slate-500">
                {slot}
              </div>
              {days.map((d) => {
                const iso = format(d, "yyyy-MM-dd");
                const apt = indexed.get(iso)?.get(slot);
                return (
                  <div
                    key={iso + slot}
                    className="relative border-r border-slate-100 last:border-r-0"
                    style={{ minHeight: 32 }}
                  >
                    {apt && <SlotButton apt={apt} slot={slot} onClick={() => openModal(apt)} />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <p className="text-center text-xs text-slate-500">Се вчитуваат термини…</p>
      )}

      {/* Appointment detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Детали за термин"
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            <X className="h-4 w-4" /> Затвори
          </Button>
        }
      >
        {selected && (
          <div className="space-y-4">
            {/* Status + type badges */}
            <div className="flex items-center gap-2">
              <Badge tone={appointmentStatusTone(selected.status)}>{selected.status}</Badge>
              {selected.appointmentType === "VIRTUAL" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                  <Video className="h-3 w-3" /> Виртуелен
                </span>
              )}
            </div>

            <Row icon={User}  label="Пациент" value={selected.patientName} />
            <Row
              icon={Clock}
              label="Термин"
              value={`${format(parseISO(selected.appointmentDate), "EEEE, d MMM")} · ${formatTime(
                selected.appointmentTime.substring(0, 5),
              )} (${selected.durationMinutes} мин)`}
            />
            {selected.reason       && <Row label="Причина"   value={selected.reason} />}
            {selected.hospitalName && <Row label="Болница"   value={selected.hospitalName} />}

            {/* ── Telemedicine section ── */}
            {selected.appointmentType === "VIRTUAL" && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-violet-800">
                  <Video className="h-4 w-4" />
                  Видео-повик
                </div>

                {/* Join button — shown when URL exists and appointment is not terminal */}
                {selected.videoCallUrl && !isTerminal(selected) && (
                  <a
                    href={selected.videoCallUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Приклучи се на повикот
                  </a>
                )}

                {/* Display current URL (read-only when terminal) */}
                {selected.videoCallUrl && isTerminal(selected) && (
                  <p className="break-all text-xs text-violet-700">{selected.videoCallUrl}</p>
                )}

                {/* Set / update URL — only for non-terminal appointments */}
                {!isTerminal(selected) && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-violet-700">
                      {selected.videoCallUrl ? "Промени линк" : "Додај видео линк"}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-violet-400" />
                        <input
                          type="url"
                          value={videoUrlDraft}
                          onChange={(e) => setVideoUrlDraft(e.target.value)}
                          placeholder="https://meet.google.com/..."
                          className="w-full rounded-lg border border-violet-200 bg-white py-2 pl-8 pr-3 text-sm placeholder:text-violet-300 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                        />
                      </div>
                      <Button
                        size="sm"
                        disabled={!videoUrlDraft.trim() || setVideoUrlMutation.isPending}
                        loading={setVideoUrlMutation.isPending}
                        onClick={() =>
                          setVideoUrlMutation.mutate({
                            id:  selected.id,
                            url: videoUrlDraft.trim(),
                          })
                        }
                      >
                        Зачувај
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function SlotButton({
  apt,
  slot,
  onClick,
}: {
  apt: AppointmentResponse;
  slot: string;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const isVirtual = apt.appointmentType === "VIRTUAL";

  return (
    <>
      <motion.button
        layout
        whileHover={{ scale: 1.04, zIndex: 5 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn(
          "absolute inset-0.5 flex items-center justify-start overflow-hidden rounded-md px-1.5 text-[11px] font-medium shadow-sm transition-colors",
          statusBg(apt.status, isVirtual),
        )}
      >
        {isVirtual && <Video className="mr-1 h-2.5 w-2.5 shrink-0 opacity-80" />}
        <span className="truncate">{apt.patientName}</span>
      </motion.button>

      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-xl"
          >
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                {apt.patientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900">{apt.patientName}</p>
                <p className="text-[10px] text-slate-500">
                  {formatTime(slot)} · {apt.durationMinutes} мин
                </p>
              </div>
            </div>
            {apt.reason && (
              <p className="mt-2 line-clamp-2 text-[11px] text-slate-600">{apt.reason}</p>
            )}
            <div className="mt-2 flex items-center gap-1.5">
              <Badge tone={appointmentStatusTone(apt.status)}>{apt.status}</Badge>
              {isVirtual && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                  <Video className="h-2.5 w-2.5" /> Виртуелен
                </span>
              )}
            </div>
            {isVirtual && apt.videoCallUrl && (
              <p className="mt-1.5 text-[10px] text-emerald-600 font-medium">● Видео линкот е поставен</p>
            )}
            {isVirtual && !apt.videoCallUrl && (
              <p className="mt-1.5 text-[10px] text-amber-600 font-medium">⚠ Видео линкот недостасува</p>
            )}
            <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-slate-200 bg-white" aria-hidden />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("inline-block h-3 w-3 rounded-sm", swatch)} />
      {label}
    </span>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      ) : (
        <span className="mt-0.5 inline-block h-4 w-4 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}
