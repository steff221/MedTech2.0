"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppointmentCard } from "@/components/patient/AppointmentCard";
import { BookAppointmentWizard } from "@/components/patient/BookAppointmentWizard";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { cn } from "@/utils/cn";
import { usePatientProfile } from "@/hooks/usePatient";
import { patientService } from "@/services/patient.service";
import type { AppointmentResponse, AppointmentStatus } from "@/types/api";

type Filter = "ALL" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL",       label: "Сите" },
  { value: "SCHEDULED", label: "Претстојни" },
  { value: "COMPLETED", label: "Завршени" },
  { value: "CANCELLED", label: "Откажани" },
];

export default function AppointmentsPage() {
  const profile = usePatientProfile();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [bookOpen, setBookOpen] = useState(false);

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", profile.data?.id],
    queryFn: () => patientService.appointments(profile.data!.id),
    enabled: !!profile.data?.id,
  });

  const filtered: AppointmentResponse[] = (appointmentsQuery.data?.content ?? []).filter((a) =>
    filter === "ALL" ? true : matchesFilter(a.status, filter),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Прегледи</h1>
          <p className="text-sm text-slate-500">Закажани посети, историја и резервации.</p>
        </div>
        <Button onClick={() => setBookOpen(true)} disabled={!profile.data}>
          <Plus className="h-4 w-4" />
          Нов преглед
        </Button>
      </div>

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "relative flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "text-brand-700" : "text-slate-600 hover:text-slate-900",
              )}
            >
              {active && (
                <motion.span
                  layoutId="appt-filter"
                  className="absolute inset-0 rounded-lg bg-brand-50"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative">{f.label}</span>
            </button>
          );
        })}
      </div>

      {appointmentsQuery.isLoading || profile.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !profile.data ? (
        <EmptyState
          title="Профилот не е поставен"
          description="Пополни го профилот од почетната страна пред да закажеш преглед."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Нема прегледи"
          description={
            filter === "ALL"
              ? "Сè уште немаш закажано ниеден преглед."
              : filter === "SCHEDULED"
              ? "Нема претстојни прегледи."
              : filter === "COMPLETED"
              ? "Нема завршени прегледи."
              : "Нема откажани прегледи."
          }
          action={
            filter === "ALL" ? (
              <Button onClick={() => setBookOpen(true)}>Закажи преглед</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))}
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

function matchesFilter(status: AppointmentStatus, filter: Filter): boolean {
  if (filter === "SCHEDULED") return status === "SCHEDULED" || status === "RESCHEDULED";
  if (filter === "COMPLETED")  return status === "COMPLETED";
  if (filter === "CANCELLED")  return status === "CANCELLED" || status === "NO_SHOW";
  return true;
}
