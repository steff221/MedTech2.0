"use client";

import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { Skeleton } from "@/components/common/Skeleton";
import { PatientDetailDrawer } from "./PatientDetailDrawer";
import { useDoctorPatients, type DoctorPatientSummary } from "@/hooks/useDoctorPatients";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { formatDate, initials } from "@/utils/format";

const MOCK_PATIENTS: DoctorPatientSummary[] = [
  {
    patientId: 1001,
    patientName: "Марија Петровска",
    appointments: [
      { id: 1, patientId: 1001, patientName: "Марија Петровска", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-05-28", appointmentTime: "09:00", durationMinutes: 30, status: "SCHEDULED", appointmentType: "CONSULTATION", reason: "Редовна контрола", cancellationReason: null, videoCallUrl: null, createdAt: "2026-05-10T08:00:00" },
      { id: 2, patientId: 1001, patientName: "Марија Петровска", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-03-15", appointmentTime: "10:30", durationMinutes: 30, status: "COMPLETED", appointmentType: "CONSULTATION", reason: null, cancellationReason: null, videoCallUrl: null, createdAt: "2026-03-01T09:00:00" },
    ],
    lastSeen: "2026-03-15",
    nextAppointment: { id: 1, patientId: 1001, patientName: "Марија Петровска", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-05-28", appointmentTime: "09:00", durationMinutes: 30, status: "SCHEDULED", appointmentType: "CONSULTATION", reason: "Редовна контрола", cancellationReason: null, videoCallUrl: null, createdAt: "2026-05-10T08:00:00" },
    hasUrgent: false,
  },
  {
    patientId: 1002,
    patientName: "Александар Стојановски",
    appointments: [
      { id: 3, patientId: 1002, patientName: "Александар Стојановски", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-05-21", appointmentTime: "11:00", durationMinutes: 45, status: "SCHEDULED", appointmentType: "PROCEDURE", reason: "ЕКГ и крвна слика", cancellationReason: null, videoCallUrl: null, createdAt: "2026-05-12T10:00:00" },
    ],
    lastSeen: null,
    nextAppointment: { id: 3, patientId: 1002, patientName: "Александар Стојановски", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-05-21", appointmentTime: "11:00", durationMinutes: 45, status: "SCHEDULED", appointmentType: "PROCEDURE", reason: "ЕКГ и крвна слика", cancellationReason: null, videoCallUrl: null, createdAt: "2026-05-12T10:00:00" },
    hasUrgent: true,
  },
  {
    patientId: 1003,
    patientName: "Елена Николовска",
    appointments: [
      { id: 4, patientId: 1003, patientName: "Елена Николовска", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-04-10", appointmentTime: "08:30", durationMinutes: 30, status: "COMPLETED", appointmentType: "CONSULTATION", reason: "Притисок", cancellationReason: null, videoCallUrl: null, createdAt: "2026-04-01T07:00:00" },
      { id: 5, patientId: 1003, patientName: "Елена Николовска", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-02-20", appointmentTime: "09:00", durationMinutes: 30, status: "COMPLETED", appointmentType: "CONSULTATION", reason: null, cancellationReason: null, videoCallUrl: null, createdAt: "2026-02-10T08:00:00" },
    ],
    lastSeen: "2026-04-10",
    nextAppointment: null,
    hasUrgent: false,
  },
  {
    patientId: 1004,
    patientName: "Борче Димовски",
    appointments: [
      { id: 6, patientId: 1004, patientName: "Борче Димовски", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-05-30", appointmentTime: "14:00", durationMinutes: 30, status: "SCHEDULED", appointmentType: "CONSULTATION", reason: "Контрола на шеќер", cancellationReason: null, videoCallUrl: null, createdAt: "2026-05-14T13:00:00" },
      { id: 7, patientId: 1004, patientName: "Борче Димовски", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-03-05", appointmentTime: "14:00", durationMinutes: 30, status: "CANCELLED", appointmentType: "CONSULTATION", reason: null, cancellationReason: "Пациентот откажа", videoCallUrl: null, createdAt: "2026-02-25T12:00:00" },
    ],
    lastSeen: null,
    nextAppointment: { id: 6, patientId: 1004, patientName: "Борче Димовски", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-05-30", appointmentTime: "14:00", durationMinutes: 30, status: "SCHEDULED", appointmentType: "CONSULTATION", reason: "Контрола на шеќер", cancellationReason: null, videoCallUrl: null, createdAt: "2026-05-14T13:00:00" },
    hasUrgent: false,
  },
  {
    patientId: 1005,
    patientName: "Сања Велкоска",
    appointments: [
      { id: 8, patientId: 1005, patientName: "Сања Велкоска", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-05-05", appointmentTime: "10:00", durationMinutes: 30, status: "COMPLETED", appointmentType: "CONSULTATION", reason: "Болки во градите", cancellationReason: null, videoCallUrl: null, createdAt: "2026-04-28T09:00:00" },
    ],
    lastSeen: "2026-05-05",
    nextAppointment: null,
    hasUrgent: false,
  },
  {
    patientId: 1006,
    patientName: "Горан Трајковски",
    appointments: [
      { id: 9, patientId: 1006, patientName: "Горан Трајковски", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-06-03", appointmentTime: "09:30", durationMinutes: 30, status: "SCHEDULED", appointmentType: "CONSULTATION", reason: "Лабораториски наоди", cancellationReason: null, videoCallUrl: null, createdAt: "2026-05-18T08:00:00" },
    ],
    lastSeen: null,
    nextAppointment: { id: 9, patientId: 1006, patientName: "Горан Трајковски", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-06-03", appointmentTime: "09:30", durationMinutes: 30, status: "SCHEDULED", appointmentType: "CONSULTATION", reason: "Лабораториски наоди", cancellationReason: null, videoCallUrl: null, createdAt: "2026-05-18T08:00:00" },
    hasUrgent: false,
  },
  {
    patientId: 1007,
    patientName: "Ана Коцевска",
    appointments: [
      { id: 10, patientId: 1007, patientName: "Ана Коцевска", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-04-22", appointmentTime: "15:30", durationMinutes: 30, status: "COMPLETED", appointmentType: "CONSULTATION", reason: null, cancellationReason: null, videoCallUrl: null, createdAt: "2026-04-15T14:00:00" },
      { id: 11, patientId: 1007, patientName: "Ана Коцевска", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-01-18", appointmentTime: "11:00", durationMinutes: 30, status: "COMPLETED", appointmentType: "CONSULTATION", reason: null, cancellationReason: null, videoCallUrl: null, createdAt: "2026-01-10T10:00:00" },
    ],
    lastSeen: "2026-04-22",
    nextAppointment: null,
    hasUrgent: false,
  },
  {
    patientId: 1008,
    patientName: "Методи Стефановски",
    appointments: [
      { id: 12, patientId: 1008, patientName: "Методи Стефановски", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-05-21", appointmentTime: "08:00", durationMinutes: 60, status: "SCHEDULED", appointmentType: "PROCEDURE", reason: "Ултразвук на абдомен", cancellationReason: null, videoCallUrl: null, createdAt: "2026-05-15T07:00:00" },
    ],
    lastSeen: null,
    nextAppointment: { id: 12, patientId: 1008, patientName: "Методи Стефановски", doctorId: 1, doctorName: "Dr. Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, hospitalName: "ЈЗУ Универзитетска клиника", appointmentDate: "2026-05-21", appointmentTime: "08:00", durationMinutes: 60, status: "SCHEDULED", appointmentType: "PROCEDURE", reason: "Ултразвук на абдомен", cancellationReason: null, videoCallUrl: null, createdAt: "2026-05-15T07:00:00" },
    hasUrgent: true,
  },
];

// ── Critical value flags derived from mock medical records ──────────────────
const CRITICAL_FLAGS: Record<number, { level: "critical" | "warning"; reason: string }> = {
  1002: { level: "critical", reason: "HbA1c 9.2% — лоша гликемиска контрола" },
  1004: { level: "warning",  reason: "Гладен шеќер 8.4 mmol/L, BMI 35.7" },
  1005: { level: "critical", reason: "СТ депресија V4-V6 — суспектна нестабилна ангина" },
  1006: { level: "warning",  reason: "Протеинурија 0.4 g/24h, ХББ ст.2" },
  1008: { level: "warning",  reason: "SpO2 94%, ХОББ GOLD ст.2" },
};

interface PatientsListPanelProps {
  doctorId: number;
}

type Tab = "ALL" | "TODAY" | "UPCOMING" | "PAST";

function isSameDayIso(a: string, ref: Date) {
  const refIso =
    `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}-${String(ref.getDate()).padStart(2, "0")}`;
  return a === refIso;
}

export function PatientsListPanel({ doctorId }: PatientsListPanelProps) {
  const t = useT();
  const TABS: { key: Tab; label: string }[] = [
    { key: "ALL",      label: t.doctorPatients.tabAll      },
    { key: "TODAY",    label: t.doctorPatients.tabToday    },
    { key: "UPCOMING", label: t.doctorPatients.tabUpcoming },
    { key: "PAST",     label: t.doctorPatients.tabPast     },
  ];
  const { summaries: realSummaries, isLoading } = useDoctorPatients(doctorId);
  const summaries = realSummaries.length > 0 ? realSummaries : MOCK_PATIENTS;
  const [tab, setTab] = useState<Tab>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: number; name: string } | null>(null);

  const filtered = useMemo(() => {
    const today = new Date();
    const q = search.trim().toLowerCase();
    return summaries.filter((s) => {
      if (q && !s.patientName.toLowerCase().includes(q)) return false;
      if (tab === "TODAY") {
        return s.appointments.some((a) => isSameDayIso(a.appointmentDate, today));
      }
      if (tab === "UPCOMING") return !!s.nextAppointment;
      if (tab === "PAST") return !s.nextAppointment && !!s.lastSeen;
      return true;
    });
  }, [summaries, tab, search]);

  return (
    // The list sits in its own z-50 stacking context. The drawer is rendered
    // OUTSIDE this wrapper so its overlay (fixed z-40, page context) is below
    // the list (z-50, page context) — allowing direct patient switching.
    <>
      <div className="relative z-50">
      <Card>
        <Input
          placeholder={t.doctorPatients.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mt-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {TABS.map((t) => {
            const active = tab === t.key;
            const count =
              t.key === "ALL"
                ? summaries.length
                : t.key === "TODAY"
                  ? summaries.filter((s) =>
                      s.appointments.some((a) => isSameDayIso(a.appointmentDate, new Date())),
                    ).length
                  : t.key === "UPCOMING"
                    ? summaries.filter((s) => s.nextAppointment).length
                    : summaries.filter((s) => !s.nextAppointment && s.lastSeen).length;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "text-emerald-700" : "text-slate-600 hover:text-slate-900",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="patients-tab"
                    className="absolute inset-0 rounded-md bg-white shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">
                  {t.label} <span className="ml-1 text-xs opacity-60">{count}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-5">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={User}
            title={t.doctorPatients.noPatients}
            description={t.doctorPatients.noPatientsDesc}
          />
        ) : (
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
            className="space-y-2"
          >
            {filtered.map((p) => (
              <motion.li
                key={p.patientId}
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
                }}
              >
                <PatientRow
                  summary={p}
                  criticalFlag={CRITICAL_FLAGS[p.patientId] ?? null}
                  onSelect={() => setSelected({ id: p.patientId, name: p.patientName })}
                />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>

      </div>

      <PatientDetailDrawer
        open={!!selected}
        patientId={selected?.id ?? null}
        patientName={selected?.name ?? ""}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function PatientRow({
  summary,
  criticalFlag,
  onSelect,
}: {
  summary: DoctorPatientSummary;
  criticalFlag: { level: "critical" | "warning"; reason: string } | null;
  onSelect: () => void;
}) {
  const t = useT();
  const [firstName, ...rest] = summary.patientName.split(" ");
  const lastName = rest.join(" ");
  const totalCompleted = summary.appointments.filter((a) => a.status === "COMPLETED").length;
  const totalCancelled = summary.appointments.filter(
    (a) => a.status === "CANCELLED" || a.status === "NO_SHOW",
  ).length;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border bg-white px-4 py-3 text-left transition-all hover:shadow-card",
        criticalFlag?.level === "critical"
          ? "border-rose-200 hover:border-rose-300"
          : criticalFlag?.level === "warning"
            ? "border-amber-200 hover:border-amber-300"
            : "border-slate-200 hover:border-emerald-300",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          criticalFlag?.level === "critical"
            ? "bg-rose-100 text-rose-700"
            : criticalFlag?.level === "warning"
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700",
        )}
      >
        {initials(firstName, lastName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900">{summary.patientName}</p>
          {summary.hasUrgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
              <AlertCircle className="h-3 w-3" /> {t.doctorPatients.urgentCase}
            </span>
          )}
          {criticalFlag?.level === "critical" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
              <AlertTriangle className="h-3 w-3" /> {t.doctorPatients.criticalValue}
            </span>
          )}
          {criticalFlag?.level === "warning" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              <AlertTriangle className="h-3 w-3" /> {t.doctorPatients.warning}
            </span>
          )}
          {summary.nextAppointment && (
            <Badge tone="info">Претстоен · {formatDate(summary.nextAppointment.appointmentDate, "d MMM")}</Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {summary.appointments.length} {t.doctorPatients.appointments}
          {totalCompleted > 0 ? ` · ${totalCompleted} ${t.doctorPatients.completed}` : ""}
          {totalCancelled > 0 ? ` · ${totalCancelled} ${t.doctorPatients.cancelled}` : ""}
          {summary.lastSeen ? ` · ${t.doctorPatients.lastSeen} ${formatDate(summary.lastSeen, "d MMM")}` : ""}
        </p>
        {criticalFlag && (
          <p
            className={cn(
              "mt-0.5 text-[10px] font-medium",
              criticalFlag.level === "critical" ? "text-rose-600" : "text-amber-600",
            )}
          >
            {criticalFlag.reason}
          </p>
        )}
      </div>
      <Search className="h-4 w-4 text-slate-300" />
    </button>
  );
}
