"use client";

import { AnimatePresence, motion } from "framer-motion";
import { addDays, addWeeks, format, isSameDay, parseISO, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/common/Button";
import { Badge, appointmentStatusTone } from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { doctorService } from "@/services/doctor.service";
import { cn } from "@/utils/cn";
import { formatTime } from "@/utils/format";
import type { AppointmentResponse, AppointmentStatus } from "@/types/api";

interface WeeklyCalendarProps {
  doctorId: number;
}

const START_HOUR = 8;
const END_HOUR = 17;
const SLOT_MINUTES = 20;

// Pre-compute slot rows: 08:00, 08:20, 08:40, ..., 16:40
const SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

function statusBg(status: AppointmentStatus): string {
  switch (status) {
    case "SCHEDULED":
      return "bg-emerald-500/90 text-white hover:bg-emerald-600";
    case "COMPLETED":
      return "bg-slate-400 text-white hover:bg-slate-500";
    case "RESCHEDULED":
      return "bg-amber-500 text-white hover:bg-amber-600";
    case "CANCELLED":
    case "NO_SHOW":
      return "bg-rose-400 text-white hover:bg-rose-500";
  }
}

export function WeeklyCalendar({ doctorId }: WeeklyCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<AppointmentResponse | null>(null);

  const weekStart = useMemo(
    () => addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset),
    [weekOffset],
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // One query per day. React Query dedupes/caches per ['appointments', 'doctor', id, date].
  const dayQueries = useQueries({
    queries: days.map((d) => {
      const iso = format(d, "yyyy-MM-dd");
      return {
        queryKey: ["appointments", "doctor", doctorId, iso],
        queryFn: () => doctorService.appointmentsOn(doctorId, iso),
        staleTime: 60 * 1000,
      };
    }),
  });

  // Index appointments by date and starting slot for O(1) cell lookup.
  const indexed = useMemo(() => {
    const map = new Map<string, Map<string, AppointmentResponse>>();
    dayQueries.forEach((q, i) => {
      const iso = format(days[i], "yyyy-MM-dd");
      const inner = new Map<string, AppointmentResponse>();
      q.data?.content.forEach((apt) => {
        // appointmentTime is "HH:mm" or "HH:mm:ss"; normalize to "HH:mm"
        const key = apt.appointmentTime.substring(0, 5);
        // Snap to the slot grid (floor to nearest 20-min boundary)
        const [h, m] = key.split(":").map(Number);
        const snapped = `${String(h).padStart(2, "0")}:${String(Math.floor(m / SLOT_MINUTES) * SLOT_MINUTES).padStart(2, "0")}`;
        inner.set(snapped, apt);
      });
      map.set(iso, inner);
    });
    return map;
  }, [dayQueries, days]);

  const today = new Date();
  const isLoading = dayQueries.some((q) => q.isLoading);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" /> Prev week
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
            Next week <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm font-semibold text-slate-700">
          {format(days[0], "MMM d")} – {format(days[6], "MMM d, yyyy")}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <Legend swatch="bg-emerald-500" label="Scheduled" />
          <Legend swatch="bg-amber-500" label="Rescheduled" />
          <Legend swatch="bg-rose-400" label="Cancelled" />
          <Legend swatch="bg-slate-400" label="Completed" />
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {/* Day header */}
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

        {/* Time grid */}
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
                    {apt ? (
                      <motion.button
                        layout
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelected(apt)}
                        className={cn(
                          "absolute inset-0.5 flex items-center justify-start rounded-md px-1.5 text-[11px] font-medium shadow-sm transition-colors",
                          statusBg(apt.status),
                        )}
                        title={`${apt.patientName} · ${formatTime(slot)}`}
                      >
                        <span className="truncate">{apt.patientName}</span>
                      </motion.button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <p className="text-center text-xs text-slate-500">Loading appointments…</p>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Appointment"
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            <X className="h-4 w-4" /> Close
          </Button>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge tone={appointmentStatusTone(selected.status)}>{selected.status}</Badge>
              {selected.appointmentType && (
                <Badge tone="neutral">{selected.appointmentType}</Badge>
              )}
            </div>
            <Row icon={User} label="Patient" value={selected.patientName} />
            <Row
              icon={Clock}
              label="When"
              value={`${format(parseISO(selected.appointmentDate), "EEEE, MMM d")} · ${formatTime(
                selected.appointmentTime.substring(0, 5),
              )} (${selected.durationMinutes} min)`}
            />
            {selected.reason && <Row label="Reason" value={selected.reason} />}
            {selected.hospitalName && <Row label="Hospital" value={selected.hospitalName} />}
          </div>
        )}
      </Modal>
    </div>
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
