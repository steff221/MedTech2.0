"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CalendarPlus, Check, ExternalLink, Link2, UserPlus, Video, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/common/Skeleton";
import { PageBanner } from "@/components/layout/PageBanner";
import { CompleteDoctorProfilePrompt } from "@/components/doctor/CompleteDoctorProfilePrompt";
import { WeeklyCalendar } from "@/components/doctor/WeeklyCalendar";
import { appointmentService } from "@/services/appointment.service";
import { doctorService } from "@/services/doctor.service";
import { extractErrorMessage } from "@/services/api";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import { BookAppointmentModal } from "@/components/doctor/BookAppointmentModal";
import type { AppointmentResponse } from "@/types/api";

// ── No-show risk badge ────────────────────────────────────────────────────────
// Renders only for MEDIUM/HIGH bands from the ML scoring service. LOW and
// unscored (null) appointments show nothing, to avoid cluttering the schedule.
function NoShowRiskBadge({ band, risk }: { band: AppointmentResponse["noShowRiskBand"]; risk: number | null }) {
  if (band !== "HIGH" && band !== "MEDIUM") return null;
  const pct = risk != null ? `${Math.round(risk * 100)}%` : "";
  const isHigh = band === "HIGH";
  return (
    <span
      title={`Ризик од непојавување${pct ? `: ${pct}` : ""}`}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
        isHigh ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700",
      )}
    >
      <AlertTriangle className="h-2.5 w-2.5" />
      {isHigh ? "Висок ризик" : "Можен ризик"}{pct && ` · ${pct}`}
    </span>
  );
}

// ── Video URL modal ───────────────────────────────────────────────────────────
function SetVideoModal({ appointment, onClose }: { appointment: AppointmentResponse; onClose: () => void }) {
  const qc = useQueryClient();
  const t  = useT();
  const [url, setUrl] = useState(appointment.videoCallUrl ?? "");

  const mutation = useMutation({
    mutationFn: (videoCallUrl: string) => appointmentService.setVideoUrl(appointment.id, videoCallUrl),
    onSuccess: () => {
      toast.success(t.doctorSchedule.videoSaved);
      qc.invalidateQueries({ queryKey: ["appointments-today-waiting"] });
      onClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err) ?? t.doctorSchedule.videoError),
  });

  function autoGenerate() {
    const room = `medtech-${appointment.id}-${Math.random().toString(36).slice(2, 7)}`;
    setUrl(`https://meet.jit.si/${room}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-2">
          <Video className="h-5 w-5 text-violet-600" />
          <h2 className="text-base font-bold text-slate-900">{t.doctorSchedule.videoModalTitle}</h2>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Пациент: <strong>{appointment.patientName}</strong> · {appointment.appointmentTime.slice(0, 5)}
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://meet.jit.si/..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-slate-700">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={autoGenerate}
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700"
        >
          <Link2 className="h-3.5 w-3.5" /> {t.doctorSchedule.autoGenerateJitsi}
        </button>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100">
            {t.common.cancel}
          </button>
          <button
            type="button"
            disabled={!url.trim() || mutation.isPending}
            onClick={() => mutation.mutate(url.trim())}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> {t.common.save}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Waiting room ──────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);


type WaitingStatus = "waiting" | "in_room" | "completed" | "no_show";

const STATUS_ORDER: WaitingStatus[] = ["waiting", "in_room", "completed", "no_show"];

function WaitingRoom({ doctorId }: { doctorId: number }) {
  const t = useT();
  const STATUS_META = useMemo<Record<WaitingStatus, { label: string; bg: string; text: string }>>(() => ({
    waiting:   { label: t.doctorSchedule.statusWaiting,   bg: "bg-amber-100",   text: "text-amber-700"  },
    in_room:   { label: t.doctorSchedule.statusInRoom,    bg: "bg-blue-100",    text: "text-blue-700"   },
    completed: { label: t.doctorSchedule.statusCompleted, bg: "bg-emerald-100", text: "text-emerald-700"},
    no_show:   { label: t.doctorSchedule.statusNoShow,    bg: "bg-rose-100",    text: "text-rose-600"   },
  }), [t]);

  const { data: todayAppts, isLoading } = useQuery({
    queryKey: ["appointments-today-waiting", doctorId],
    queryFn:  () => doctorService.appointmentsOn(doctorId, TODAY),
    refetchInterval: 60_000,
  });

  const realPatients: AppointmentResponse[] = (todayAppts?.content ?? []).filter(
    (a) => a.status === "SCHEDULED" || a.status === "RESCHEDULED",
  );

  const basePatients = realPatients;

  // Walk-in state — persisted in localStorage, keyed by doctor+date so they
  // survive a page refresh but automatically vanish the next calendar day.
  const WALKIN_KEY = `walkins-${doctorId}-${TODAY}`;
  const [walkIns, setWalkIns] = useState<AppointmentResponse[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(WALKIN_KEY) ?? "[]"); }
    catch { return []; }
  });
  const [walkInOpen, setWalkInOpen]     = useState(false);
  const [walkInName, setWalkInName]     = useState("");
  const [walkInReason, setWalkInReason] = useState("");

  const saveWalkIns = (list: AppointmentResponse[]) => {
    setWalkIns(list);
    try { localStorage.setItem(WALKIN_KEY, JSON.stringify(list)); } catch {}
  };

  const addWalkIn = () => {
    if (!walkInName.trim()) return;
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    const entry: AppointmentResponse = {
      id: Date.now() * -1,
      patientId: 0,
      patientName: walkInName.trim(),
      doctorId: doctorId,
      doctorName: "",
      doctorSpecialization: null,
      hospitalId: null,
      hospitalName: null,
      appointmentDate: TODAY,
      appointmentTime: time,
      durationMinutes: 15,
      status: "SCHEDULED",
      appointmentType: "CONSULTATION",
      reason: walkInReason.trim() || t.doctorSchedule.walkInDefaultReason,
      cancellationReason: null,
      videoCallUrl: null,
      createdAt: TODAY,
      ratingId: null,
      ratingValue: null,
      noShowRisk: null,
      noShowRiskBand: null,
    };
    saveWalkIns([...walkIns, entry]);
    setWalkInName("");
    setWalkInReason("");
    setWalkInOpen(false);
  };

  const patients = [...basePatients, ...walkIns];

  const STATUS_KEY = `waitroom-statuses-${doctorId}-${TODAY}`;
  const [statuses, setStatuses] = useState<Record<number, WaitingStatus>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(STATUS_KEY) ?? "{}"); }
    catch { return {}; }
  });
  const [videoModalAppt, setVideoModalAppt] = useState<AppointmentResponse | null>(null);

  const getStatus = (id: number): WaitingStatus => statuses[id] ?? "waiting";

  const cycle = (id: number) => {
    setStatuses((prev) => {
      const current = prev[id] ?? "waiting";
      const nextIdx = (STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length;
      const next = { ...prev, [id]: STATUS_ORDER[nextIdx] };
      try { localStorage.setItem(STATUS_KEY, JSON.stringify(next)); } catch {}
      return next;
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
            <UserPlus className="h-3.5 w-3.5" /> {t.doctorSchedule.addWalkInBtn}
          </button>
        </div>
      </div>

      {/* Walk-in modal */}
      {walkInOpen && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-800">{t.doctorSchedule.walkInTitle}</p>
            <button type="button" onClick={() => setWalkInOpen(false)}>
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              placeholder="Име и презиме на пациентот"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              onKeyDown={(e) => e.key === "Enter" && addWalkIn()}
            />
            <input
              value={walkInReason}
              onChange={(e) => setWalkInReason(e.target.value)}
              placeholder={t.doctorSchedule.walkInReasonPlaceholder}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              onKeyDown={(e) => e.key === "Enter" && addWalkIn()}
            />
            <button
              type="button"
              onClick={addWalkIn}
              disabled={!walkInName.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {t.doctorSchedule.walkInAddBtn}
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
                  {t.doctorSchedule.noAppointmentsToday}
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
                      <NoShowRiskBadge band={p.noShowRiskBand} risk={p.noShowRisk} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.durationMinutes} {t.doctorSchedule.minutesShort}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
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
                      {isVirtual && (
                        <button
                          type="button"
                          onClick={() => setVideoModalAppt(p)}
                          className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition-colors",
                            p.videoCallUrl
                              ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                              : "bg-slate-100 text-slate-500 hover:bg-violet-100 hover:text-violet-700",
                          )}
                          title="Постави видео линк"
                        >
                          <Video className="h-3 w-3" />
                          {p.videoCallUrl ? "Линк" : "Постави"}
                        </button>
                      )}
                    </div>
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

      {videoModalAppt && (
        <SetVideoModal
          appointment={videoModalAppt}
          onClose={() => setVideoModalAppt(null)}
        />
      )}
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

        {profile.data && <WaitingRoom doctorId={profile.data.id} />}
      </div>

      <BookAppointmentModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}
