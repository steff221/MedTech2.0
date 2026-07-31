// Страница (Next.js): упати — дел за пациент.
"use client";

import { motion } from "framer-motion";
import { Calendar, ClipboardList, Clock, FileText, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays, format, parseISO } from "date-fns";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
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

function printReferral(r: ReferralResponse, typeLabel: string) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  const issued    = format(parseISO(r.createdAt), "d MMMM yyyy");
  const scheduled = format(parseISO(r.scheduledDate), "d MMMM yyyy");
  win.document.write(`
    <html>
      <head>
        <title>Упат · MedTech</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { border-bottom: 2px solid #1e5f63; padding-bottom: 16px; margin-bottom: 24px; }
          .hospital { font-size: 12px; color: #64748b; }
          .title { font-size: 22px; font-weight: bold; margin-top: 8px; }
          .ref-number { font-size: 13px; color: #64748b; margin-top: 4px; font-family: monospace; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
          .section { margin-bottom: 16px; }
          .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
          .value { font-size: 15px; font-weight: 500; margin-top: 2px; }
          .desc { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 16px; }
          .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 16px;
                    display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
          .signature-line { border-bottom: 1px solid #1e293b; width: 200px; margin-top: 40px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital">MedTech Здравствен Систем</div>
          <div class="title">МЕДИЦИНСКИ УПАТ</div>
          <div class="ref-number">Бр. ${r.referralNumber}</div>
        </div>
        <div class="grid">
          <div class="section">
            <div class="label">Пациент</div>
            <div class="value">${r.patientName}</div>
          </div>
          <div class="section">
            <div class="label">Се упатува кон</div>
            <div class="value">${r.referredTo}</div>
          </div>
          <div class="section">
            <div class="label">Тип на упат</div>
            <div class="value">${typeLabel}</div>
          </div>
          <div class="section">
            <div class="label">МКБ10</div>
            <div class="value">${r.mkb10Code ?? "/"}</div>
          </div>
          <div class="section">
            <div class="label">Издаден на</div>
            <div class="value">${issued}</div>
          </div>
          <div class="section">
            <div class="label">Закажано за</div>
            <div class="value">${scheduled}</div>
          </div>
          ${r.doctorName ? `<div class="section"><div class="label">Доктор</div><div class="value">д-р ${r.doctorName}</div></div>` : ""}
        </div>
        ${r.description ? `<div class="desc"><div class="label">Причина / опис</div><div class="value" style="margin-top:6px;">${r.description}</div></div>` : ""}
        <div style="margin-top:40px;">
          <div class="label">Потпис на доктор</div>
          <div class="signature-line"></div>
        </div>
        <div class="footer">
          <span>Издадено преку MedTech платформата</span>
          <span>${r.referralNumber}</span>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
    </html>
  `);
  win.document.close();
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

  const nextActive = useMemo(() => {
    const active = all.filter((r) => r.status === "ACTIVE").sort((a, b) =>
      a.scheduledDate.localeCompare(b.scheduledDate),
    );
    return active[0] ?? null;
  }, [all]);

  function getDaysBadge(isoDate: string) {
    const days = differenceInDays(parseISO(isoDate), new Date());
    if (days === 0)  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{rt.daysToday}</span>;
    if (days < 0)    return <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600">{rt.daysOverdue}</span>;
    if (days <= 7)   return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{rt.daysIn} {days} {rt.daysSuffix}</span>;
    return null;
  }

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

      {/* Summary stats */}
      {!profile.isLoading && !referrals.isLoading && profile.data && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{rt.statsActive}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.ACTIVE}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{rt.statsNext}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {nextActive
                ? format(parseISO(nextActive.scheduledDate), "d MMM yyyy")
                : <span className="text-slate-400 font-normal text-sm">{rt.statsNone}</span>
              }
            </p>
          </div>
        </motion.div>
      )}

      {/* Filter tabs */}
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
              <ReferralCard
                referral={r}
                typeLabel={TYPE_LABELS[r.referralType] ?? r.referralType}
                statusLabel={STATUS_LABELS[r.status]}
                daysBadge={r.status === "ACTIVE" ? getDaysBadge(r.scheduledDate) : null}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function ReferralCard({
  referral: r,
  typeLabel,
  statusLabel,
  daysBadge,
}: {
  referral: ReferralResponse;
  typeLabel: string;
  statusLabel: string;
  daysBadge: React.ReactNode;
}) {
  const t = useT();
  const rt = t.patientReferrals;

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
            <Badge tone={statusTone(r.status)}>{statusLabel}</Badge>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {typeLabel}
            </span>
            {daysBadge}
          </div>

          <p className="mt-0.5 text-sm text-slate-500">
            <span className="font-mono text-xs">{r.referralNumber}</span>
            {r.doctorName && <> · Д-р {r.doctorName}</>}
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
            <p className="mt-2 text-sm text-slate-600">{r.description}</p>
          )}

          {isCompleted && r.outcomeNote && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                {rt.outcome} · {r.outcomeDate ? format(parseISO(r.outcomeDate), "d MMM yyyy") : ""}
              </p>
              <p className="mt-1 text-sm text-emerald-900">{r.outcomeNote}</p>
            </div>
          )}

          {/* Print button */}
          <div className="mt-3 flex justify-end">
            <Button
              variant="secondary"
              className="gap-1.5 text-xs"
              onClick={() => printReferral(r, typeLabel)}
            >
              <Printer className="h-3.5 w-3.5" />
              {rt.printBtn}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
