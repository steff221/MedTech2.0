"use client";

import { motion } from "framer-motion";
import { Calendar, ClipboardList, Clock, FileText, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { cn } from "@/utils/cn";
import { referralService } from "@/services/referral.service";
import { usePatientProfile } from "@/hooks/usePatient";
import { useT } from "@/hooks/useT";
import type { ReferralResponse, ReferralStatus, ReferralType } from "@/types/api";

type Filter = "ALL" | ReferralStatus;

function statusTone(s: ReferralStatus) {
  if (s === "ACTIVE")    return "info"    as const;
  if (s === "COMPLETED") return "success" as const;
  return "neutral" as const;
}

export default function PatientReferralsPage() {
  const profile = usePatientProfile();
  const t = useT();
  const rt = t.patientReferrals;
  const [filter, setFilter] = useState<Filter>("ALL");

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "ALL",       label: rt.filterAll      },
    { key: "ACTIVE",    label: rt.filterActive   },
    { key: "COMPLETED", label: rt.filterDone     },
    { key: "CANCELLED", label: rt.filterCancelled },
  ];

  const referrals = useQuery({
    queryKey: ["patient", profile.data?.id, "referrals"],
    queryFn:  () => referralService.patientReferrals(profile.data!.id, 0, 100),
    enabled:  !!profile.data?.id,
  });

  const all = useMemo(() => referrals.data?.content ?? [], [referrals.data]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return all;
    return all.filter((r) => r.status === filter);
  }, [all, filter]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { ALL: all.length, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 };
    all.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [all]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-3xl font-bold text-slate-900">{rt.title}</h1>
        <p className="mt-1 text-slate-500">{rt.subtitle}</p>
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
                    layoutId="ref-filter"
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

      {profile.isLoading || referrals.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : !profile.data ? (
        <EmptyState title={rt.noProfile} description={rt.noProfileDesc} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={filter === "ACTIVE" ? rt.noActive : rt.noReferrals}
          description={rt.noReferralsDesc}
        />
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {filtered.map((r) => (
            <motion.div
              key={r.id}
              variants={{
                hidden:  { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
              }}
            >
              <ReferralCard referral={r} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function ReferralCard({ referral: r }: { referral: ReferralResponse }) {
  const t = useT();
  const rt = t.patientReferrals;

  const TYPE_LABELS: Record<ReferralType, string> = {
    GENERAL_MEDICINE: rt.typeGeneral,
    SPECIALIST:       rt.typeSpecialist,
    LABORATORY:       rt.typeLab,
    DIAGNOSTICS:      rt.typeDiag,
    HOSPITAL:         rt.typeHospital,
  };

  const STATUS_LABELS: Record<ReferralStatus, string> = {
    ACTIVE:    rt.statusActive,
    COMPLETED: rt.statusDone,
    CANCELLED: rt.statusCancelled,
  };

  const isActive    = r.status === "ACTIVE";
  const isCompleted = r.status === "COMPLETED";

  return (
    <Card
      className={cn(
        isActive    && "border-blue-200 bg-blue-50/30",
        isCompleted && "border-emerald-200 bg-emerald-50/30",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            isActive    ? "bg-blue-100 text-blue-700" :
            isCompleted ? "bg-emerald-100 text-emerald-700" :
            "bg-slate-100 text-slate-500",
          )}
        >
          <ClipboardList className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-lg font-bold text-slate-900">{r.referredTo}</h3>
            <Badge tone={statusTone(r.status)}>{STATUS_LABELS[r.status]}</Badge>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {TYPE_LABELS[r.referralType] ?? r.referralType}
            </span>
          </div>

          <p className="mt-0.5 text-sm text-slate-500">
            <span className="font-mono text-xs">{r.referralNumber}</span>
            {r.doctorName && <> · Dr. {r.doctorName}</>}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              {rt.issuedOn} {format(parseISO(r.createdAt), "d MMM yyyy")}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              {rt.scheduledFor} {format(parseISO(r.scheduledDate), "d MMM yyyy")}
            </span>
            {r.mkb10Code && (
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-slate-400" />
                {rt.icd10} <span className="font-mono">{r.mkb10Code}</span>
              </span>
            )}
          </div>

          {r.description && r.description !== "—" && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              {r.description}
            </p>
          )}

          {isCompleted && r.outcomeNote && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                {rt.outcome} · {r.outcomeDate ? format(parseISO(r.outcomeDate), "d MMM yyyy") : ""}
              </p>
              <p className="mt-1 text-sm text-emerald-900">{r.outcomeNote}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
