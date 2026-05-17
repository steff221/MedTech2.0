"use client";

import { motion } from "framer-motion";
import { AlertCircle, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { Skeleton } from "@/components/common/Skeleton";
import { PatientDetailDrawer } from "./PatientDetailDrawer";
import { useDoctorPatients, type DoctorPatientSummary } from "@/hooks/useDoctorPatients";
import { cn } from "@/utils/cn";
import { formatDate, initials } from "@/utils/format";

interface PatientsListPanelProps {
  doctorId: number;
}

type Tab = "ALL" | "TODAY" | "UPCOMING" | "PAST";

const TABS: { key: Tab; label: string }[] = [
  { key: "ALL",      label: "Сите" },
  { key: "TODAY",    label: "Денес" },
  { key: "UPCOMING", label: "Претстојни" },
  { key: "PAST",     label: "Минати" },
];

function isSameDayIso(a: string, ref: Date) {
  const refIso =
    `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}-${String(ref.getDate()).padStart(2, "0")}`;
  return a === refIso;
}

export function PatientsListPanel({ doctorId }: PatientsListPanelProps) {
  const { summaries, isLoading } = useDoctorPatients(doctorId);
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
    <>
      <Card>
        <Input
          placeholder="Пребарај по име, ЕМБГ, Бр.упат…"
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
            title="Нема пациенти во оваа категорија"
            description="Изберете друга картичка или пребарајте по име."
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
                  onSelect={() => setSelected({ id: p.patientId, name: p.patientName })}
                />
              </motion.li>
            ))}
          </motion.ul>
        )}
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
  onSelect,
}: {
  summary: DoctorPatientSummary;
  onSelect: () => void;
}) {
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
      className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all hover:border-emerald-300 hover:shadow-card"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
        {initials(firstName, lastName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900">{summary.patientName}</p>
          {summary.hasUrgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
              <AlertCircle className="h-3 w-3" /> Итен случај
            </span>
          )}
          {summary.nextAppointment && (
            <Badge tone="info">Претстоен · {formatDate(summary.nextAppointment.appointmentDate, "d MMM")}</Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {summary.appointments.length} прегледи
          {totalCompleted > 0 ? ` · ${totalCompleted} завршени` : ""}
          {totalCancelled > 0 ? ` · ${totalCancelled} откажани` : ""}
          {summary.lastSeen ? ` · последно ${formatDate(summary.lastSeen, "d MMM")}` : ""}
        </p>
      </div>
      <Search className="h-4 w-4 text-slate-300" />
    </button>
  );
}
