"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  HeartPulse,
  Pill,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PageBanner } from "@/components/layout/PageBanner";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

// ── Mock dashboard data ───────────────────────────────────────────────────────
const TODAY_APPOINTMENTS = [
  { id: 1, time: "08:00", patient: "Методи Стефановски",    reason: "Ултразвук на абдомен",        duration: 60, status: "completed" as const },
  { id: 2, time: "09:00", patient: "Марија Петровска",       reason: "Редовна контрола",             duration: 30, status: "completed" as const },
  { id: 3, time: "10:00", patient: "Сања Велкоска",          reason: "Болки во градите — контрола",  duration: 30, status: "in_progress" as const },
  { id: 4, time: "11:00", patient: "Александар Стојановски", reason: "ЕКГ и крвна слика",            duration: 45, status: "upcoming" as const },
  { id: 5, time: "14:00", patient: "Горан Трајковски",       reason: "Лабораториски наоди",          duration: 30, status: "upcoming" as const },
];

const FLAGGED_PATIENTS = [
  { id: 1002, name: "Александар Стојановски", level: "critical" as const, reason: "HbA1c 9.2% — лоша гликемиска контрола",         lastSeen: "18 апр" },
  { id: 1005, name: "Сања Велкоска",          level: "critical" as const, reason: "СТ депресија V4-V6 — суспектна нестабилна ангина", lastSeen: "5 мај"  },
  { id: 1004, name: "Борче Димовски",         level: "warning"  as const, reason: "Гладен шеќер 8.4 mmol/L, BMI 35.7",               lastSeen: "1 мар"  },
  { id: 1008, name: "Методи Стефановски",     level: "warning"  as const, reason: "SpO2 94% на воздух, ХОББ GOLD ст.2",              lastSeen: "10 мај" },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DoctorHomePage() {
  const { data: doctor } = useDoctorProfile();
  const t = useT();

  const completedToday = TODAY_APPOINTMENTS.filter((a) => a.status === "completed").length;
  const remainingToday = TODAY_APPOINTMENTS.filter((a) => a.status !== "completed").length;

  const APPT_STATUS = useMemo(() => ({
    completed:   { label: t.doctorHome.apptStatusCompleted,   dot: "bg-emerald-500" },
    in_progress: { label: t.doctorHome.apptStatusInProgress,  dot: "bg-blue-500 animate-pulse" },
    upcoming:    { label: t.doctorHome.apptStatusUpcoming,    dot: "bg-slate-300" },
  }), [t]);

  const PRIMARY = useMemo(() => [
    { label: t.doctorHome.calendarLabel,  href: "/doctor/schedule",        icon: Calendar,     iconBg: "bg-emerald-500", description: t.doctorHome.calendarDesc  },
    { label: t.doctorHome.patientsLabel,  href: "/doctor/patients",         icon: Users,        iconBg: "bg-violet-500",  description: t.doctorHome.patientsDesc  },
    { label: t.doctorHome.referralsLabel, href: "/doctor/referrals",        icon: ClipboardList,iconBg: "bg-sky-500",     description: t.doctorHome.referralsDesc },
    { label: t.doctorHome.documentsLabel, href: "/doctor/medical-journal",  icon: FileText,     iconBg: "bg-amber-500",   description: t.doctorHome.documentsDesc },
  ], [t]);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay },
  });

  return (
    <>
      <PageBanner title={t.doctorNav.home} />

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <motion.section {...fadeUp(0)} className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              {t.doctorHome.welcomeLabel}
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              Dr. {doctor?.firstName ?? ""} {doctor?.lastName ?? ""}
            </h2>
            {doctor && (
              <p className="text-sm text-slate-500">
                {doctor.specialization}
                {doctor.hospitalName ? ` · ${doctor.hospitalName}` : ""}
              </p>
            )}
          </div>
        </motion.section>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: t.doctorHome.statsAppointmentsToday,   value: TODAY_APPOINTMENTS.length, sub: `${completedToday} ${t.doctorHome.statsCompleted}`,  icon: Calendar,      color: "text-emerald-600", bg: "bg-emerald-50"  },
            { label: t.doctorHome.statsRemaining,           value: remainingToday,             sub: t.doctorHome.statsEndOfDay,                           icon: Clock,         color: "text-blue-600",    bg: "bg-blue-50"     },
            { label: t.doctorHome.statsActiveReferrals,     value: 3,                         sub: t.doctorHome.statsAwaiting,                           icon: ClipboardList, color: "text-sky-600",     bg: "bg-sky-50"      },
            { label: t.doctorHome.statsActivePrescriptions, value: 8,                         sub: t.doctorHome.statsAt6Patients,                        icon: Pill,          color: "text-violet-600",  bg: "bg-violet-50"   },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", s.bg)}>
                  <s.icon className={cn("h-4 w-4", s.color)} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Main grid: tiles + today + flagged ────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Nav tiles — 2 cols on the left */}
          <motion.div {...fadeUp(0.1)} className="lg:col-span-2 space-y-6">
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-4"
            >
              {PRIMARY.map((tile) => (
                <TileLink key={tile.label} tile={tile} />
              ))}
            </motion.div>

            {/* Today's schedule */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <p className="text-sm font-semibold text-slate-900">{t.doctorHome.scheduleSection}</p>
                <Link href="/doctor/schedule" className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                  {t.common.all} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="divide-y divide-slate-100">
                {TODAY_APPOINTMENTS.map((a) => {
                  const s = APPT_STATUS[a.status];
                  return (
                    <li key={a.id} className={cn("flex items-center gap-4 px-5 py-3 transition-colors", a.status === "in_progress" && "bg-blue-50/50")}>
                      <span className="w-12 shrink-0 font-mono text-sm font-semibold text-slate-700">{a.time}</span>
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", s.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{a.patient}</p>
                        <p className="truncate text-xs text-slate-500">{a.reason}</p>
                      </div>
                      <span className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                        a.status === "completed"   && "bg-emerald-100 text-emerald-700",
                        a.status === "in_progress" && "bg-blue-100 text-blue-700",
                        a.status === "upcoming"    && "bg-slate-100 text-slate-500",
                      )}>
                        {s.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {completedToday} {t.doctorHome.appointmentsOf} {TODAY_APPOINTMENTS.length} {t.doctorHome.appointmentsDone}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Flagged patients — right column */}
          <motion.div {...fadeUp(0.15)}>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden h-full">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <p className="text-sm font-semibold text-slate-900">{t.doctorHome.flaggedSection}</p>
                <Link href="/doctor/patients" className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                  {t.common.all} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="divide-y divide-slate-100">
                {FLAGGED_PATIENTS.map((p) => (
                  <li key={p.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        p.level === "critical" ? "bg-rose-100" : "bg-amber-100",
                      )}>
                        <AlertTriangle className={cn("h-3.5 w-3.5", p.level === "critical" ? "text-rose-600" : "text-amber-600")} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                        <p className={cn("text-xs leading-snug mt-0.5", p.level === "critical" ? "text-rose-600" : "text-amber-600")}>
                          {p.reason}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">{t.doctorHome.lastSeen} {p.lastSeen}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5">
                <p className="text-xs text-slate-400">
                  {FLAGGED_PATIENTS.filter((p) => p.level === "critical").length} {t.doctorHome.criticalCount} ·{" "}
                  {FLAGGED_PATIENTS.filter((p) => p.level === "warning").length} {t.doctorHome.warningCount}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}

// ── TileLink ──────────────────────────────────────────────────────────────────
interface Tile {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  description?: string;
}

function TileLink({ tile }: { tile: Tile }) {
  const item = {
    hidden:  { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div variants={item}>
      <Link href={tile.href}>
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-shadow hover:shadow-cardHover"
        >
          <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${tile.iconBg} text-white`}>
            <tile.icon className="h-5 w-5" />
          </div>
          <p className="font-semibold text-slate-900">{tile.label}</p>
          {tile.description && (
            <p className="mt-0.5 text-sm text-slate-500">{tile.description}</p>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}
