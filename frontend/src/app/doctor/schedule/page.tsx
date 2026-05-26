"use client";

import { motion } from "framer-motion";
import { CalendarPlus, UserPlus, Video, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/common/Skeleton";
import { PageBanner } from "@/components/layout/PageBanner";
import { CompleteDoctorProfilePrompt } from "@/components/doctor/CompleteDoctorProfilePrompt";
import { WeeklyCalendar } from "@/components/doctor/WeeklyCalendar";
import { appointmentService } from "@/services/appointment.service";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import { BookAppointmentModal } from "@/components/doctor/BookAppointmentModal";
import type { AppointmentResponse } from "@/types/api";

// ── Waiting room ──────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);


type WaitingStatus = "waiting" | "in_room" | "completed" | "no_show";

const STATUS_ORDER: WaitingStatus[] = ["waiting", "in_room", "completed", "no_show"];

function WaitingRoom() {
  const t = useT();
  const STATUS_META = useMemo<Record<WaitingStatus, { label: string; bg: string; text: string }>>(() => ({
    waiting:   { label: t.doctorSchedule.statusWaiting,   bg: "bg-amber-100",   text: "text-amber-700"  },
    in_room:   { label: t.doctorSchedule.statusInRoom,    bg: "bg-blue-100",    text: "text-blue-700"   },
    completed: { label: t.doctorSchedule.statusCompleted, bg: "bg-emerald-100", text: "text-emerald-700"},
    no_show:   { label: t.doctorSchedule.statusNoShow,    bg: "bg-rose-100",    text: "text-rose-600"   },
  }), [t]);

  const { data: todayAppts, isLoading } = useQuery({
    queryKey: ["appointments-today-waiting"],
    queryFn:  () => appointmentService.today(),
    refetchInterval: 60_000,
  });

  const realPatients: AppointmentResponse[] = (todayAppts ?? []).filter(
    (a) => a.status === "SCHEDULED" || a.status === "RESCHEDULED",
  );

  const basePatients = realPatients;

  // Walk-in state
  const [walkIns, setWalkIns]         = useState<AppointmentResponse[]>([]);
  const [walkInOpen, setWalkInOpen]   = useState(false);
  const [walkInName, setWalkInName]   = useState("");
  const [walkInReason, setWalkInReason] = useState("");

  const addWalkIn = () => {
    if (!walkInName.trim()) return;
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    const entry: AppointmentResponse = {
      id: Date.now() * -1,
      patientId: 0,
      patientName: walkInName.trim(),
      doctorId: 0,
      doctorName: "",
      doctorSpecialization: null,
      hospitalId: null,
      hospitalName: null,
      appointmentDate: TODAY,
      appointmentTime: time,
      durationMinutes: 15,
      status: "SCHEDULED",
      appointmentType: "CONSULTATION",
      reason: walkInReason.trim() || "Влезен без термин",
      cancellationReason: null,
      videoCallUrl: null,
      createdAt: TODAY,
    };
    setWalkIns((prev) => [...prev, entry]);
    setWalkInName("");
    setWalkInReason("");
    setWalkInOpen(false);
  };

  const patients = [...basePatients, ...walkIns];

  const [statuses, setStatuses] = useState<Record<number, WaitingStatus>>({});

  const getStatus = (id: number): WaitingStatus => statuses[id] ?? "waiting";

  const cycle = (id: number) => {
    setStatuses((prev) => {
      const current = prev[id] ?? "waiting";
      const nextIdx = (STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length;
      return { ...prev, [id]: STATUS_ORDER[nextIdx] };
    });
  };

  const counts = STATUS_ORDER.reduce<Record<WaitingStatus, number>>(
    (acc, s) => {
      acc[s] = patients.filter((p) => getStatus(p.id) === s).length;
      return acc;
    },
    { waiting: 0, in_room: 0, completed: 0, no_show: 0 },
  );

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          {t.doctorSchedule.waitingRoomTitle}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-2 text-xs">
            {STATUS_ORDER.map((s) => {
              const m = STATUS_META[s];
              return (
                <span key={s} className={cn("rounded-full px-2 py-0.5 font-medium", m.bg, m.text)}>
                  {m.label}: {counts[s]}
                </span>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setWalkInOpen(true)}
            className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" /> Додај пациент
          </button>
        </div>
      </div>

      {/* Walk-in modal */}
      {walkInOpen && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-800">Влезен без термин</p>
            <button type="button" onClick={() => setWalkInOpen(false)}>
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              placeholder="Ime i prezime na pacientot"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              onKeyDown={(e) => e.key === "Enter" && addWalkIn()}
            />
            <input
              value={walkInReason}
              onChange={(e) => setWalkInReason(e.target.value)}
              placeholder="Причина (по избор)"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              onKeyDown={(e) => e.key === "Enter" && addWalkIn()}
            />
            <button
              type="button"
              onClick={addWalkIn}
              disabled={!walkInName.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Додај
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {[t.doctorSchedule.colTime, t.doctorSchedule.colPatient, t.doctorSchedule.colReason, t.doctorSchedule.colDuration, t.doctorSchedule.colStatus].map((c) => (
                <th key={c} className="border-b border-slate-200 px-4 py-2.5 text-left font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              [0, 1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-slate-100">
                  {[0, 1, 2, 3, 4].map((j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && patients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                  Нема закажани термини денес.
                </td>
              </tr>
            )}

            {!isLoading && patients.map((p, i) => {
              const status = getStatus(p.id);
              const m = STATUS_META[status];
              const isVirtual = p.appointmentType === "VIRTUAL";
              return (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "border-b border-slate-100 transition-colors",
                    status === "in_room"   && "bg-blue-50/40",
                    status === "completed" && "bg-slate-50 opacity-70",
                  )}
                >
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-700">
                    {p.appointmentTime.substring(0, 5)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-900">{p.patientName}</span>
                      {isVirtual && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                          <Video className="h-2.5 w-2.5" /> Виртуелен
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.durationMinutes} {t.doctorSchedule.minutesShort}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => cycle(p.id)}
                      title={t.doctorSchedule.clickToCycle}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold transition-all hover:opacity-80 active:scale-95",
                        m.bg,
                        m.text,
                      )}
                    >
                      {m.label}
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        <p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-400">
          {t.doctorSchedule.clickToCycle}
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DoctorSchedulePage() {
  const profile = useDoctorProfile();
  const t = useT();
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <PageBanner
        title="Календар на активности"
        breadcrumb={[{ label: "Календар" }, { label: "Распоред" }]}
        actions={
          profile.data && (
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <CalendarPlus className="h-4 w-4" />
              {t.doctorBooking.title}
            </button>
          )
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {profile.isLoading ? (
            <Skeleton className="h-96" />
          ) : profile.data === null ? (
            <CompleteDoctorProfilePrompt />
          ) : profile.data ? (
            <WeeklyCalendar doctorId={profile.data.id} />
          ) : null}
        </motion.div>

        <WaitingRoom />
      </div>

      <BookAppointmentModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}
