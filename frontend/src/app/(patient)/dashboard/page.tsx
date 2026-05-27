"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Calendar,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Heart,
  Pill,
  Plus,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays, format, parseISO } from "date-fns";
import { BookAppointmentWizard } from "@/components/patient/BookAppointmentWizard";
import { CompleteProfilePrompt } from "@/components/patient/CompleteProfilePrompt";
import { Skeleton } from "@/components/common/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePatientProfile } from "@/hooks/usePatient";
import { useT } from "@/hooks/useT";
import { patientService } from "@/services/patient.service";
import { referralService } from "@/services/referral.service";
import { cn } from "@/utils/cn";
import type { AppointmentResponse, PrescriptionResponse } from "@/types/api";

function greet(t: ReturnType<typeof import("@/hooks/useT").useT>): string {
  const h = new Date().getHours();
  if (h < 12) return t.dashboard.greetMorning;
  if (h < 18) return t.dashboard.greetAfternoon;
  return t.dashboard.greetEvening;
}

// ── Next appointment countdown card ──────────────────────────────────────────
function NextAppointmentCard({ appt }: { appt: AppointmentResponse }) {
  const days = differenceInDays(
    parseISO(appt.appointmentDate),
    new Date(),
  );
  const isToday = days === 0;
  const isTomorrow = days === 1;

  const dayLabel = isToday
    ? "Денес"
    : isTomorrow
    ? "Утре"
    : `За ${days} дена`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 p-6 text-white shadow-lg shadow-brand-500/20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -left-4 h-24 w-24 rounded-full bg-white/5"
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
            Следен термин
          </p>
          <p className="mt-2 text-3xl font-bold">{dayLabel}</p>
          <p className="mt-1 text-lg font-semibold text-white/90">
            {appt.doctorName}
          </p>
          {appt.doctorSpecialization && (
            <p className="text-sm text-white/60">{appt.doctorSpecialization}</p>
          )}
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur">
          <Calendar className="h-7 w-7" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-white/80">
          <Clock className="h-3.5 w-3.5" />
          {format(parseISO(appt.appointmentDate), "dd MMM yyyy")} · {appt.appointmentTime.slice(0, 5)}
        </span>
        {appt.hospitalName && (
          <span className="flex items-center gap-1.5 text-white/80">
            <Stethoscope className="h-3.5 w-3.5" />
            {appt.hospitalName}
          </span>
        )}
      </div>

      <Link
        href="/appointments"
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white transition-colors"
      >
        Сите термини <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </motion.div>
  );
}

// ── Stats row ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  href: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Link href={href}>
        <div className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200 hover:shadow-md">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
            {sub && <p className="text-xs text-slate-400">{sub}</p>}
          </div>
          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
        </div>
      </Link>
    </motion.div>
  );
}

// ── Active prescriptions mini list ────────────────────────────────────────────
function ActiveRxCard({ prescriptions }: { prescriptions: PrescriptionResponse[] }) {
  const active = prescriptions.filter((p) => p.status === "ACTIVE").slice(0, 3);
  if (active.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-800">Активни рецепти</h2>
        </div>
        <Link href="/prescriptions" className="text-xs font-medium text-brand-600 hover:text-brand-700">
          Сите →
        </Link>
      </div>
      <ul className="space-y-2.5">
        {active.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{p.medicationName}</p>
              <p className="text-xs text-slate-400">{p.dosage} · {p.frequency}</p>
            </div>
            <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
              Активен
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ── Health snapshot ───────────────────────────────────────────────────────────
function HealthSnapshot({ patient }: { patient: { bloodType?: string | null; allergies?: string | null; chronicConditions?: string | null } }) {
  const hasInfo = patient.bloodType || patient.allergies || patient.chronicConditions;
  if (!hasInfo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <Heart className="h-4 w-4 text-rose-500" />
        <h2 className="text-sm font-semibold text-slate-800">Здравствен профил</h2>
      </div>
      <div className="space-y-3">
        {patient.bloodType && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Крвна група</span>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
              {patient.bloodType.replace("_POS", "+").replace("_NEG", "−")}
            </span>
          </div>
        )}
        {patient.allergies && (
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" /> Алергии
            </p>
            <p className="text-xs text-slate-600">{patient.allergies}</p>
          </div>
        )}
        {patient.chronicConditions && (
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Хронични состојби</p>
            <p className="text-xs text-slate-600">{patient.chronicConditions}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const profile = usePatientProfile();
  const t = useT();
  const [bookOpen, setBookOpen] = useState(false);

  const appointments = useQuery({
    queryKey: ["appointments", profile.data?.id],
    queryFn: () => patientService.appointments(profile.data!.id),
    enabled: !!profile.data?.id,
  });

  const prescriptions = useQuery({
    queryKey: ["prescriptions", "patient", profile.data?.id],
    queryFn: () => patientService.prescriptions(profile.data!.id, 0, 50),
    enabled: !!profile.data?.id,
  });

  const referrals = useQuery({
    queryKey: ["referrals", "my"],
    queryFn: () => referralService.myReferrals(undefined, 0, 50),
    enabled: !!profile.data?.id,
  });

  const records = useQuery({
    queryKey: ["records", profile.data?.id],
    queryFn: () => patientService.medicalRecords(profile.data!.id, 0, 1),
    enabled: !!profile.data?.id,
  });

  const upcoming = (appointments.data?.content ?? []).filter(
    (a) => a.status === "SCHEDULED" || a.status === "RESCHEDULED",
  );
  const nextAppt = upcoming[0] ?? null;

  const activePrescriptions = (prescriptions.data?.content ?? []).filter(
    (p) => p.status === "ACTIVE",
  );
  const activeReferrals = (referrals.data?.content ?? []).filter(
    (r) => r.status === "ACTIVE",
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between"
      >
        <div>
          <p className="text-sm font-medium text-brand-600">
            {greet(t)}, {user?.firstName ?? ""}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{t.dashboard.title}</h1>
          <p className="mt-1 text-slate-500">{t.dashboard.subtitle}</p>
        </div>
        <button
          onClick={() => setBookOpen(true)}
          className="hidden items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors sm:flex"
        >
          <Plus className="h-4 w-4" /> {t.dashboard.bookBtn}
        </button>
      </motion.div>

      {profile.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0,1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      ) : profile.data === null ? (
        <CompleteProfilePrompt />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Left column — main content */}
          <div className="space-y-6 lg:col-span-2">

            {/* Next appointment */}
            {nextAppt ? (
              <NextAppointmentCard appt={nextAppt} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-10 text-center"
              >
                <Calendar className="h-10 w-10 text-slate-300" />
                <div>
                  <p className="font-semibold text-slate-700">{t.dashboard.noApptTitle}</p>
                  <p className="mt-1 text-sm text-slate-400">{t.dashboard.noApptDesc}</p>
                </div>
                <button
                  onClick={() => setBookOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  <Plus className="h-4 w-4" /> {t.dashboard.bookBtn}
                </button>
              </motion.div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                icon={Calendar}
                label="Термини"
                value={upcoming.length}
                sub="Закажани"
                href="/appointments"
                color="bg-sky-500"
                delay={0.12}
              />
              <StatCard
                icon={Pill}
                label="Рецепти"
                value={activePrescriptions.length}
                sub="Активни"
                href="/prescriptions"
                color="bg-violet-500"
                delay={0.16}
              />
              <StatCard
                icon={ClipboardList}
                label="Упати"
                value={activeReferrals.length}
                sub="Активни"
                href="/referrals"
                color="bg-amber-500"
                delay={0.2}
              />
              <StatCard
                icon={FileText}
                label="Записи"
                value={records.data?.totalElements ?? "—"}
                sub="Вкупно"
                href="/health-records"
                color="bg-emerald-500"
                delay={0.24}
              />
            </div>

            {/* Upcoming appointments list */}
            {upcoming.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.28 }}
                className="rounded-2xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 className="text-sm font-semibold text-slate-800">
                    {t.dashboard.upcomingTitle}
                  </h2>
                  <Link href="/appointments" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                    Сите →
                  </Link>
                </div>
                <ul className="divide-y divide-slate-50">
                  {upcoming.slice(0, 4).map((appt) => (
                    <li key={appt.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                        {appt.doctorName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{appt.doctorName}</p>
                        <p className="text-xs text-slate-400">
                          {format(parseISO(appt.appointmentDate), "dd MMM")} · {appt.appointmentTime.slice(0, 5)}
                          {appt.doctorSpecialization ? ` · ${appt.doctorSpecialization}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Закажан
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* Right column — sidebar widgets */}
          <div className="space-y-5">
            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <h2 className="mb-4 text-sm font-semibold text-slate-800">Брзи акции</h2>
              <div className="space-y-2">
                {[
                  { href: "/appointments", label: "Закажи термин", icon: Calendar, color: "text-sky-600 bg-sky-50" },
                  { href: "/health-records", label: "Здравствен досие", icon: Activity, color: "text-emerald-600 bg-emerald-50" },
                  { href: "/prescriptions", label: "Моите рецепти", icon: Pill, color: "text-violet-600 bg-violet-50" },
                  { href: "/doctors", label: "Најди лекар", icon: Stethoscope, color: "text-amber-600 bg-amber-50" },
                  { href: "/referrals", label: "Моите упати", icon: ClipboardList, color: "text-rose-600 bg-rose-50" },
                ].map(({ href, label, icon: Icon, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Active prescriptions */}
            {!prescriptions.isLoading && activePrescriptions.length > 0 && (
              <ActiveRxCard prescriptions={prescriptions.data?.content ?? []} />
            )}

            {/* Health snapshot */}
            {profile.data && <HealthSnapshot patient={profile.data} />}
          </div>
        </div>
      )}

      {profile.data && (
        <BookAppointmentWizard
          open={bookOpen}
          onClose={() => setBookOpen(false)}
          patientId={profile.data.id}
        />
      )}
    </div>
  );
}
