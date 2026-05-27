"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  HeartPulse,
  Star,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { PageBanner } from "@/components/layout/PageBanner";
import { Skeleton } from "@/components/common/Skeleton";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { useT } from "@/hooks/useT";
import { appointmentService } from "@/services/appointment.service";
import { referralService } from "@/services/referral.service";
import { ratingService } from "@/services/rating.service";
import { cn } from "@/utils/cn";
import type { AppointmentResponse } from "@/types/api";

const FLAGGED_PATIENTS = [
  { id: 1002, name: "Александар Стојановски", level: "critical" as const, reason: "HbA1c 9.2% — лоша гликемиска контрола",          lastSeen: "18 апр" },
  { id: 1005, name: "Сања Велкоска",          level: "critical" as const, reason: "СТ депресија V4-V6 — суспектна нестабилна ангина", lastSeen: "5 мај"  },
  { id: 1004, name: "Борче Димовски",         level: "warning"  as const, reason: "Гладен шеќер 8.4 mmol/L, BMI 35.7",                lastSeen: "1 мар"  },
  { id: 1008, name: "Методи Стефановски",     level: "warning"  as const, reason: "SpO2 94% на воздух, ХОББ GOLD ст.2",               lastSeen: "10 мај" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
});

function greet(): string {
  const h = new Date().getHours();
  if (h < 12) return "Добро утро";
  if (h < 18) return "Добар ден";
  return "Добра вечер";
}

function apptStatusMeta(a: AppointmentResponse): { label: string; dot: string; row: string; badge: string } {
  const now = new Date();
  const [hh, mm] = a.appointmentTime.split(":").map(Number);
  const start = new Date();
  start.setHours(hh, mm, 0, 0);
  const end = new Date(start.getTime() + a.durationMinutes * 60_000);

  if (a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW") {
    return { label: "Завршен", dot: "bg-emerald-500", row: "", badge: "bg-emerald-100 text-emerald-700" };
  }
  if (now >= start && now <= end) {
    return { label: "Во тек", dot: "bg-blue-500 animate-pulse", row: "bg-blue-50/50", badge: "bg-blue-100 text-blue-700" };
  }
  return { label: "Претстои", dot: "bg-slate-300", row: "", badge: "bg-slate-100 text-slate-500" };
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color, bg, delay,
}: {
  label: string; value: number | string; sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; delay: number;
}) {
  return (
    <motion.div {...fadeUp(delay)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bg)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </motion.div>
  );
}

// ── Nav tile ──────────────────────────────────────────────────────────────────
function TileLink({ tile }: { tile: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; iconBg: string; description?: string } }) {
  return (
    <Link href={tile.href}>
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
        className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
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
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DoctorHomePage() {
  const { data: doctor } = useDoctorProfile();
  const t = useT();

  const todayAppts = useQuery({
    queryKey: ["appointments-today"],
    queryFn: () => appointmentService.today(),
    refetchInterval: 60_000,
  });

  const referrals = useQuery({
    queryKey: ["referrals", "my", "ACTIVE"],
    queryFn: () => referralService.myReferrals("ACTIVE", 0, 1),
    enabled: !!doctor,
  });

  const rating = useQuery({
    queryKey: ["rating-summary", doctor?.id],
    queryFn: () => ratingService.summaryForDoctor(doctor!.id),
    enabled: !!doctor,
  });

  const appts = todayAppts.data ?? [];
  const scheduled = appts.filter((a) => a.status === "SCHEDULED" || a.status === "RESCHEDULED");
  const completed = appts.filter((a) => a.status === "COMPLETED");
  const remaining = scheduled.length;
  const activeReferrals = referrals.data?.totalElements ?? 0;
  const avgRating = rating.data?.averageRating;

  const PRIMARY = [
    { label: t.doctorHome.calendarLabel,  href: "/doctor/schedule",       icon: Calendar,      iconBg: "bg-emerald-500", description: t.doctorHome.calendarDesc  },
    { label: t.doctorHome.patientsLabel,  href: "/doctor/patients",        icon: Users,         iconBg: "bg-violet-500",  description: t.doctorHome.patientsDesc  },
    { label: t.doctorHome.referralsLabel, href: "/doctor/referrals",       icon: ClipboardList, iconBg: "bg-sky-500",     description: t.doctorHome.referralsDesc },
    { label: t.doctorHome.documentsLabel, href: "/doctor/medical-journal", icon: FileText,      iconBg: "bg-amber-500",   description: t.doctorHome.documentsDesc },
  ];

  return (
    <>
      <PageBanner title={t.doctorNav.home} />

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">

        {/* Greeting */}
        <motion.section {...fadeUp(0)} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                {greet()} · {format(new Date(), "EEEE, dd MMM yyyy")}
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
          </div>
          {avgRating != null && (
            <motion.div {...fadeUp(0.1)} className="hidden items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 sm:flex">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-amber-700">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-amber-500">/ 5 · {rating.data?.totalRatings} оценки</span>
            </motion.div>
          )}
        </motion.section>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Термини денес"
            value={todayAppts.isLoading ? "—" : appts.length}
            sub={`${completed.length} завршени`}
            icon={Calendar}
            color="text-emerald-600"
            bg="bg-emerald-50"
            delay={0.05}
          />
          <StatCard
            label="Преостануваат"
            value={todayAppts.isLoading ? "—" : remaining}
            sub="До крај на ден"
            icon={Clock}
            color="text-blue-600"
            bg="bg-blue-50"
            delay={0.09}
          />
          <StatCard
            label="Активни упати"
            value={referrals.isLoading ? "—" : activeReferrals}
            sub="На чекање"
            icon={ClipboardList}
            color="text-sky-600"
            bg="bg-sky-50"
            delay={0.13}
          />
          <StatCard
            label="Просечна оценка"
            value={avgRating != null ? avgRating.toFixed(1) : "—"}
            sub={`${rating.data?.totalRatings ?? 0} оценки вкупно`}
            icon={Star}
            color="text-amber-600"
            bg="bg-amber-50"
            delay={0.17}
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Left: nav tiles + schedule */}
          <motion.div {...fadeUp(0.1)} className="space-y-6 lg:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              {PRIMARY.map((tile) => (
                <TileLink key={tile.label} tile={tile} />
              ))}
            </div>

            {/* Today's schedule — real data */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <p className="text-sm font-semibold text-slate-900">{t.doctorHome.scheduleSection}</p>
                <Link href="/doctor/schedule" className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                  {t.common.all} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {todayAppts.isLoading ? (
                <div className="space-y-3 p-4">
                  {[0,1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : appts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Calendar className="h-8 w-8 text-slate-200" />
                  <p className="text-sm text-slate-400">Нема закажани термини денес</p>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-slate-100">
                    {appts.slice(0, 6).map((a) => {
                      const s = apptStatusMeta(a);
                      return (
                        <li key={a.id} className={cn("flex items-center gap-4 px-5 py-3 transition-colors", s.row)}>
                          <span className="w-12 shrink-0 font-mono text-sm font-semibold text-slate-700">
                            {a.appointmentTime.slice(0, 5)}
                          </span>
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", s.dot)} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{a.patientName}</p>
                            <p className="truncate text-xs text-slate-500">
                              {a.reason ?? "—"}
                              {a.appointmentType === "VIRTUAL" && (
                                <span className="ml-1.5 inline-flex items-center gap-0.5 text-violet-500">
                                  <Video className="h-3 w-3" /> Виртуелен
                                </span>
                              )}
                            </p>
                          </div>
                          <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium", s.badge)}>
                            {s.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {completed.length} {t.doctorHome.appointmentsOf} {appts.length} {t.doctorHome.appointmentsDone}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Right: flagged patients + quick links + recent reviews */}
          <motion.div {...fadeUp(0.15)} className="space-y-5">
            {/* Flagged patients */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <p className="text-sm font-semibold text-slate-900">Пациенти на внимание</p>
                <Link href="/doctor/patients" className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                  Сите <ArrowRight className="h-3 w-3" />
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
                        <p className="mt-1 text-[11px] text-slate-400">Последно виден: {p.lastSeen}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5">
                <p className="text-xs text-slate-400">
                  {FLAGGED_PATIENTS.filter((p) => p.level === "critical").length} критични ·{" "}
                  {FLAGGED_PATIENTS.filter((p) => p.level === "warning").length} предупредувања
                </p>
              </div>
            </div>

            {/* Quick links */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <p className="text-sm font-semibold text-slate-900">Брзи врски</p>
              </div>
              <div className="divide-y divide-slate-50">
                {[
                  { href: "/doctor/referrals",       label: "Упати",              icon: ClipboardList, color: "text-sky-600 bg-sky-50"     },
                  { href: "/doctor/operations",       label: "Операции",           icon: FileText,      color: "text-amber-600 bg-amber-50"  },
                  { href: "/doctor/medical-journal",  label: "Медицински дневник", icon: FileText,      color: "text-emerald-600 bg-emerald-50" },
                  { href: "/doctor/availability",     label: "Работно расписание", icon: Clock,         color: "text-violet-600 bg-violet-50" },
                  { href: "/doctor/notifications",    label: "Известувања",        icon: HeartPulse,    color: "text-rose-600 bg-rose-50"    },
                ].map(({ href, label, icon: Icon, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                  >
                    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs", color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent reviews */}
            {rating.data && rating.data.recentReviews.content.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-3.5">
                  <p className="text-sm font-semibold text-slate-900">Последни оценки</p>
                </div>
                <ul className="divide-y divide-slate-50">
                  {rating.data.recentReviews.content.slice(0, 3).map((r) => (
                    <li key={r.id} className="px-5 py-3.5">
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn("h-3 w-3", i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200")}
                          />
                        ))}
                        <span className="ml-1.5 text-[10px] text-slate-400">
                          {format(parseISO(r.createdAt), "dd MMM")}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700">{r.patientName}</p>
                      {r.comment && (
                        <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{r.comment}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </>
  );
}
