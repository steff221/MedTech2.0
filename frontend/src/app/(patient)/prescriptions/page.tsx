"use client";

import { motion } from "framer-motion";
import { Pill, Repeat, Stethoscope } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { cn } from "@/utils/cn";
import { patientService } from "@/services/patient.service";
import { usePatientProfile } from "@/hooks/usePatient";
import type { PrescriptionResponse, PrescriptionStatus } from "@/types/api";

type Filter = "ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL",       label: "Сите"      },
  { key: "ACTIVE",    label: "Активни"   },
  { key: "COMPLETED", label: "Завршени"  },
  { key: "CANCELLED", label: "Откажани"  },
];

function statusTone(s: PrescriptionStatus) {
  if (s === "ACTIVE") return "success" as const;
  if (s === "COMPLETED") return "neutral" as const;
  if (s === "CANCELLED" || s === "SUSPENDED") return "danger" as const;
  return "neutral" as const;
}

function statusLabel(s: PrescriptionStatus) {
  if (s === "ACTIVE") return "Активен";
  if (s === "COMPLETED") return "Завршен";
  if (s === "CANCELLED") return "Откажан";
  if (s === "SUSPENDED") return "Суспендиран";
  return s;
}

export default function PrescriptionsPage() {
  const profile = usePatientProfile();
  const [filter, setFilter] = useState<Filter>("ACTIVE");

  const rx = useQuery({
    queryKey: ["patient", profile.data?.id, "prescriptions"],
    queryFn: () => patientService.prescriptions(profile.data!.id, 0, 100),
    enabled: !!profile.data?.id,
  });

  const all = useMemo(() => rx.data?.content ?? [], [rx.data]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return all;
    return all.filter((p) => p.status === filter);
  }, [all, filter]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { ALL: all.length, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 };
    all.forEach((p) => {
      if (p.status === "ACTIVE") c.ACTIVE++;
      else if (p.status === "COMPLETED") c.COMPLETED++;
      else if (p.status === "CANCELLED" || p.status === "SUSPENDED") c.CANCELLED++;
    });
    return c;
  }, [all]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-3xl font-bold text-slate-900">Рецепти</h1>
        <p className="mt-1 text-slate-500">
          Активни лекови, дополнувања и целосна историја на рецепти.
        </p>
      </motion.div>

      <Card>
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "relative flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "text-brand-700" : "text-slate-600 hover:text-slate-900",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="rx-filter"
                    className="absolute inset-0 rounded-md bg-white shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">
                  {f.label}{" "}
                  <span className="ml-1 text-xs opacity-60">{counts[f.key]}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {profile.isLoading || rx.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !profile.data ? (
        <EmptyState
          title="Профилот не е поставен"
          description="Пополни го пациентскиот профил за да ги видиш рецептите."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Pill}
          title={filter === "ACTIVE" ? "Нема активни рецепти" : "Нема записи"}
          description="Кога лекар ќе издаде рецепт, ќе се прикаже овде."
        />
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
              }}
            >
              <PrescriptionRow rx={p} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function PrescriptionRow({ rx }: { rx: PrescriptionResponse }) {
  const isActive = rx.status === "ACTIVE";

  return (
    <Card className={cn(isActive && "border-emerald-200 bg-emerald-50/30")}>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
          )}
        >
          <Pill className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-lg font-bold text-slate-900">{rx.medicationName}</h3>
            <Badge tone={statusTone(rx.status)}>{statusLabel(rx.status)}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-slate-600">
            <span className="font-semibold">{rx.dosage}</span> · {rx.frequency}
            {rx.route ? ` · ${rx.route.toLowerCase()}` : ""}
          </p>
          {rx.doctorName && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Stethoscope className="h-3 w-3" /> Dr. {rx.doctorName}
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <Stat label="Почеток" value={format(parseISO(rx.startDate), "d MMM yyyy")} />
            {rx.endDate && (
              <Stat label="Крај" value={format(parseISO(rx.endDate), "d MMM yyyy")} />
            )}
            {rx.durationDays && <Stat label="Времетраење" value={`${rx.durationDays} дена`} />}
            {rx.quantity != null && <Stat label="Количина" value={`${rx.quantity}`} />}
            {rx.refillsAllowed > 0 && (
              <Stat
                label="Дополнувања"
                value={
                  <span className="flex items-center gap-1">
                    <Repeat className="h-3 w-3 text-slate-400" />
                    {rx.refillsUsed} / {rx.refillsAllowed}
                  </span>
                }
              />
            )}
          </div>

          {rx.instructions && (
            <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700">
              <span className="font-semibold">Упатства: </span>
              {rx.instructions}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
