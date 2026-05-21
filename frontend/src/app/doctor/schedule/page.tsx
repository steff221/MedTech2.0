"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/common/Skeleton";
import { PageBanner } from "@/components/layout/PageBanner";
import { CompleteDoctorProfilePrompt } from "@/components/doctor/CompleteDoctorProfilePrompt";
import { WeeklyCalendar } from "@/components/doctor/WeeklyCalendar";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";

// ── Waiting room ──────────────────────────────────────────────────────────────
type WaitingStatus = "waiting" | "in_room" | "completed" | "no_show";

interface WaitingPatient {
  id: number;
  time: string;
  patient: string;
  reason: string;
  durationMin: number;
}

const TODAY_PATIENTS: WaitingPatient[] = [
  { id: 1, time: "08:00", patient: "Методи Стефановски",   reason: "Ултразвук на абдомен",       durationMin: 60 },
  { id: 2, time: "09:00", patient: "Марија Петровска",      reason: "Редовна контрола",            durationMin: 30 },
  { id: 3, time: "10:00", patient: "Сања Велкоска",         reason: "Болки во градите — контрола", durationMin: 30 },
  { id: 4, time: "11:00", patient: "Александар Стојановски",reason: "ЕКГ и крвна слика",           durationMin: 45 },
  { id: 5, time: "14:00", patient: "Горан Трајковски",      reason: "Лабораториски наоди",         durationMin: 30 },
];

const STATUS_ORDER: WaitingStatus[] = ["waiting", "in_room", "completed", "no_show"];

function WaitingRoom() {
  const t = useT();
  const STATUS_META = useMemo<Record<WaitingStatus, { label: string; bg: string; text: string }>>(() => ({
    waiting:   { label: t.doctorSchedule.statusWaiting,   bg: "bg-amber-100",   text: "text-amber-700"  },
    in_room:   { label: t.doctorSchedule.statusInRoom,    bg: "bg-blue-100",    text: "text-blue-700"   },
    completed: { label: t.doctorSchedule.statusCompleted, bg: "bg-emerald-100", text: "text-emerald-700"},
    no_show:   { label: t.doctorSchedule.statusNoShow,    bg: "bg-rose-100",    text: "text-rose-600"   },
  }), [t]);

  const [statuses, setStatuses] = useState<Record<number, WaitingStatus>>(
    Object.fromEntries(TODAY_PATIENTS.map((p) => [p.id, "waiting" as WaitingStatus])),
  );

  const cycle = (id: number) => {
    setStatuses((prev) => {
      const current = prev[id] ?? "waiting";
      const nextIdx = (STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length;
      return { ...prev, [id]: STATUS_ORDER[nextIdx] };
    });
  };

  const counts = STATUS_ORDER.reduce<Record<WaitingStatus, number>>(
    (acc, s) => {
      acc[s] = Object.values(statuses).filter((v) => v === s).length;
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
      </div>

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
            {TODAY_PATIENTS.map((p, i) => {
              const status = statuses[p.id] ?? "waiting";
              const m = STATUS_META[status];
              return (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "border-b border-slate-100 transition-colors",
                    status === "in_room" && "bg-blue-50/40",
                    status === "completed" && "bg-slate-50 opacity-70",
                  )}
                >
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-700">{p.time}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.patient}</td>
                  <td className="px-4 py-3 text-slate-600">{p.reason}</td>
                  <td className="px-4 py-3 text-slate-500">{p.durationMin} {t.doctorSchedule.minutesShort}</td>
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

  return (
    <>
      <PageBanner
        title="Календар на активности"
        breadcrumb={[{ label: "Календар" }, { label: "Распоред" }]}
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
    </>
  );
}
