// Страница (Next.js): упати — дел за доктор.
"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Filter, Plus, Printer, Search, XCircle } from "lucide-react";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { FilterChips } from "@/components/common/FilterChips";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { PageBanner } from "@/components/layout/PageBanner";
import { Skeleton } from "@/components/common/Skeleton";
import { NewReferralForm, referralResponseToRow, type ReferralRow } from "@/components/doctor/NewReferralForm";
import { referralService } from "@/services/referral.service";
import { patientService } from "@/services/patient.service";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { printReferralDocument } from "@/utils/referralPrint";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { matchesSearch } from "@/utils/search";
import type { ReferralType } from "@/types/api";

type StatusFilter = "ALL" | "active" | "completed" | "cancelled";

const TYPE_VALUES: Array<{ value: ReferralType | "ALL" }> = [
  { value: "ALL" },
  { value: "SPECIALIST_EXAM" },
  { value: "LABORATORY" },
  { value: "RADIOLOGY" },
  { value: "HOSPITAL" },
];

export default function ReferralsPage() {
  const t = useT();
  const queryClient = useQueryClient();

  const STATUS_META: Record<ReferralRow["status"], { label: string; tone: "info" | "success" | "neutral" }> = {
    active:    { label: t.doctorReferrals.statusActive,    tone: "info"    },
    completed: { label: t.doctorReferrals.statusCompleted, tone: "success" },
    cancelled: { label: t.doctorReferrals.statusCancelled, tone: "neutral" },
  };

  const TYPE_LABELS: Record<ReferralType | "ALL", string> = {
    ALL:              t.common.all,
    SPECIALIST_EXAM: t.doctorReferrals.typeSpecialist,
    LABORATORY:      t.doctorReferrals.typeLab,
    RADIOLOGY:       t.doctorReferrals.typeRadiology,
    HOSPITAL:        t.doctorReferrals.typeHospital,
  };

  const COLUMNS = [
    t.doctorReferrals.colCreatedAt,
    t.doctorReferrals.colScheduledFor,
    t.doctorReferrals.colReferredTo,
    t.doctorReferrals.colPatient,
    t.doctorReferrals.colType,
    t.doctorReferrals.colMkb10,
    t.doctorReferrals.colDescription,
    t.doctorReferrals.colStatus,
    "",
  ];

  const [formOpen, setFormOpen]         = useState(false);
  const [typeFilter, setTypeFilter]     = useState<ReferralType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [dateFrom, setDateFrom]         = useState("");
  const [search, setSearch]             = useState("");
  const [pageSize, setPageSize]         = useState(10);

  const [outcomeTarget, setOutcomeTarget] = useState<ReferralRow | null>(null);
  const [outcomeNote, setOutcomeNote]     = useState("");
  const [outcomeDate, setOutcomeDate]     = useState(new Date().toISOString().slice(0, 10));

  const [cancelTarget, setCancelTarget] = useState<ReferralRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  // Referrals whose row is saved but whose document never reached the printer.
  // Tracked so the doctor is never left holding a number and no paper.
  const [unprinted, setUnprinted] = useState<Set<number>>(new Set());

  const { data: doctorProfile } = useDoctorProfile();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["doctor-referrals"],
    queryFn:  () => referralService.myReferrals(undefined, 0, 200),
    staleTime: 5 * 60_000,
  });

  const referrals: ReferralRow[] = data?.content.map(referralResponseToRow) ?? [];

  const completeMutation = useMutation({
    mutationFn: ({ id, outcomeDate, outcomeNote }: { id: number; outcomeDate: string; outcomeNote: string }) =>
      referralService.complete(id, { outcomeDate, outcomeNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-referrals"] });
      toast.success(t.doctorReferrals.outcomeSuccess);
      setOutcomeTarget(null);
    },
    onError: () => toast.error(t.doctorReferrals.outcomeError),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      referralService.cancel(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-referrals"] });
      toast.success(t.doctorReferrals.cancelSuccess);
      setCancelTarget(null);
      setCancelReason("");
    },
    onError: () => toast.error(t.doctorReferrals.cancelError),
  });

  /**
   * Печати. The referral row already exists at this point, so a failure here
   * has to be reported precisely — a bare "error" would leave the doctor
   * unsure whether the referral was issued at all.
   */
  const handlePrint = async (row: ReferralRow) => {
    const full = data?.content.find((x) => x.id === row.backendId);
    if (!full) return;

    // ФЗОМ boxes need ЕМБГ/ЕЗБО, which the list response does not carry.
    let patient;
    try {
      patient = await patientService.byId(full.patientId);
    } catch {
      patient = undefined; // identity boxes print as ruled blanks
    }

    const result = printReferralDocument({
      referral: full,
      doctor:   doctorProfile ?? undefined,
      patient,
      doctorSpecialtyMk: doctorProfile
        ? t.specialties[doctorProfile.specialization] ?? doctorProfile.specialization
        : undefined,
    });

    if (!result.ok) {
      setUnprinted((prev) => new Set(prev).add(row.backendId!));
      toast.error(
        result.reason === "popup-blocked"
          ? t.doctorReferrals.printBlocked
          : t.doctorReferrals.printFailed,
      );
      return;
    }

    setUnprinted((prev) => {
      const next = new Set(prev);
      next.delete(row.backendId!);
      return next;
    });
    // Records printedAt server-side. A failure to record must not look like a
    // failure to print — the paper exists either way.
    if (row.backendId) {
      referralService.markPrinted(row.backendId).catch(() => {});
    }
  };

  const handleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["doctor-referrals"] });
  };

  const openOutcomeModal = (r: ReferralRow) => {
    setOutcomeTarget(r);
    setOutcomeNote("");
    setOutcomeDate(new Date().toISOString().slice(0, 10));
  };

  const submitOutcome = () => {
    if (!outcomeTarget?.backendId) return;
    completeMutation.mutate({ id: outcomeTarget.backendId, outcomeDate, outcomeNote });
  };

  const confirmCancel = () => {
    if (!cancelTarget?.backendId) return;
    if (!cancelReason.trim()) return;
    cancelMutation.mutate({ id: cancelTarget.backendId, reason: cancelReason.trim() });
  };

  const filtered = referrals.filter((r) => {
    if (typeFilter !== "ALL" && r.referralTypeValue !== typeFilter) return false;
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (dateFrom && r.scheduledDateIso < dateFrom) return false;
    if (
      search &&
      !matchesSearch(
        [r.patientName, r.referredTo, r.id, r.mkb10Code].join(" "),
        search,
      )
    )
      return false;
    return true;
  });

  const displayed     = filtered.slice(0, pageSize);
  const activeCount   = referrals.filter((r) => r.status === "active").length;
  const completedCount= referrals.filter((r) => r.status === "completed").length;

  function getDaysBadge(isoDate: string) {
    const days = differenceInCalendarDays(parseISO(isoDate), new Date());
    if (days === 0) return <span className="chip chip-wait ml-1">Денес</span>;
    if (days < 0)   return <span className="chip chip-alert ml-1">+{Math.abs(days)}д</span>;
    if (days <= 3)  return <span className="chip chip-ok ml-1">за {days}д</span>;
    return null;
  }

  return (
    <>
      <PageBanner
        title={t.doctorNav.referrals}
        breadcrumb={[{ label: t.doctorNav.referrals }]}
        actions={
          <Button
            className="bg-white !text-emerald-700 hover:!bg-emerald-50"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="h-4 w-4" /> {t.doctorReferrals.newBtn}
          </Button>
        }
      />

      <NewReferralForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={handleCreated}
        existingReferrals={referrals}
      />

      {/* Outcome modal */}
      <Modal
        open={!!outcomeTarget}
        onClose={() => setOutcomeTarget(null)}
        title={t.doctorReferrals.outcomeModalTitle}
        description={outcomeTarget ? `${outcomeTarget.patientName} → ${outcomeTarget.referredTo}` : ""}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOutcomeTarget(null)}>{t.common.cancel}</Button>
            <Button onClick={submitOutcome} disabled={completeMutation.isPending}>
              {completeMutation.isPending ? "Се зачувува…" : t.doctorReferrals.outcomeSubmit}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t.doctorReferrals.outcomeDate}
            type="date"
            value={outcomeDate}
            onChange={(e) => setOutcomeDate(e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t.doctorReferrals.outcomeNote}
            </label>
            <textarea
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
              rows={4}
              placeholder="пр. Кардиолог потврди стабилна ангина, воведен нитрат…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>
      </Modal>

      {/* Cancel confirmation modal */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title={t.doctorReferrals.cancelConfirmTitle}
        description={cancelTarget ? `${cancelTarget.patientName} → ${cancelTarget.referredTo}` : ""}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>{t.common.cancel}</Button>
            <Button
              onClick={confirmCancel}
              disabled={cancelMutation.isPending || !cancelReason.trim()}
              className="!bg-rose-600 hover:!bg-rose-700"
            >
              {cancelMutation.isPending ? "Се откажува…" : t.doctorReferrals.cancelConfirmBtn}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">{t.doctorReferrals.cancelConfirmDesc}</p>

        {/* The number stays reserved, so the record has to say why it was
            voided — otherwise nobody can later answer what happened to it. */}
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            {t.doctorReferrals.cancelReasonLabel} *
          </span>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            className="w-full"
            placeholder={t.doctorReferrals.cancelReasonPlaceholder}
          />
        </label>
        <p className="mt-1.5 text-xs text-slate-500">{t.doctorReferrals.cancelReasonHint}</p>
      </Modal>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Stats */}
        <div className="mb-5 grid grid-cols-3 gap-4">
          {[
            { label: t.doctorReferrals.statsTotal,     value: referrals.length },
            { label: t.doctorReferrals.statsActive,    value: activeCount       },
            { label: t.doctorReferrals.statsCompleted, value: completedCount    },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {isLoading ? <Skeleton className="h-7 w-12" /> : isError ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter strip */}
        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Filter className="h-4 w-4" /> {t.doctorReferrals.filterTitle}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            {/* Type filter — uses raw enum values, labels from translations */}
            <FilterChips
              label={t.doctorReferrals.filterType}
              value={typeFilter}
              onChange={setTypeFilter}
              options={TYPE_VALUES.map(({ value }) => ({ value, label: TYPE_LABELS[value] }))}
            />

            {/* Status filter */}
            <FilterChips
              label={t.doctorReferrals.filterStatus}
              value={statusFilter}
              onChange={setStatusFilter}
              options={(["ALL", "active", "completed", "cancelled"] as StatusFilter[]).map((s) => ({
                value: s,
                label: s === "ALL" ? t.common.all : STATUS_META[s as ReferralRow["status"]].label,
              }))}
            />

            <Input label={t.doctorReferrals.filterDateFrom} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">{t.doctorReferrals.filterSearch}</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Пациент, специјалист, МКБ, бр.упат…"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="secondary"
              onClick={() => { setTypeFilter("ALL"); setStatusFilter("ALL"); setDateFrom(""); setSearch(""); }}
            >
              {t.doctorReferrals.filterReset}
            </Button>
          </div>
        </Card>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {t.doctorReferrals.resultsLabel} ({filtered.length})
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{t.doctorReferrals.rowsLabel}</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c} className="border-b border-slate-200 px-3 py-2 text-left font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {COLUMNS.map((c) => (
                        <td key={c} className="px-3 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                )}

                {!isLoading && displayed.map((r, i) => {
                  const s = STATUS_META[r.status];
                  return (
                    <React.Fragment key={r.id}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-slate-100 hover:bg-emerald-50/40"
                      >
                        <td className="px-3 py-2.5 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {r.createdAt}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          <span>{r.scheduledDate}</span>
                          {r.status === "active" && getDaysBadge(r.scheduledDateIso)}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">{r.referredTo}</td>
                        <td className="px-3 py-2.5 text-slate-700">{r.patientName}</td>
                        <td className="px-3 py-2.5 text-slate-700">{r.referralType}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-700">{r.mkb10Code}</td>
                        <td className="max-w-[180px] truncate px-3 py-2.5 text-slate-600">{r.description}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col items-start gap-1">
                            <Badge tone={s.tone}>{s.label}</Badge>
                            {r.backendId && unprinted.has(r.backendId) && (
                              <span className="chip chip-wait" title={t.doctorReferrals.notPrintedHint}>
                                {t.doctorReferrals.notPrinted}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            {/* Печати. A voided referral keeps its number but
                                must not produce a fresh document — the control
                                states the reason rather than sitting dead. */}
                            {r.status === "cancelled" ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-400"
                                title={t.doctorReferrals.printCancelled}
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span className="hidden xl:inline">{t.doctorReferrals.printCancelled}</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handlePrint(r)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                                title={t.doctorReferrals.printBtn}
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span className="hidden xl:inline">
                                  {r.backendId && unprinted.has(r.backendId)
                                    ? t.doctorReferrals.printRetry
                                    : t.doctorReferrals.printBtn}
                                </span>
                              </button>
                            )}
                            {r.status === "active" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openOutcomeModal(r)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                                  title={t.doctorReferrals.actionComplete}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span className="hidden xl:inline">{t.doctorReferrals.actionComplete}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCancelTarget(r)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50"
                                  title={t.doctorReferrals.actionCancel}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span className="hidden xl:inline">{t.doctorReferrals.actionCancel}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                      {r.status === "completed" && r.outcomeNote && (
                        <tr key={`${r.id}-outcome`} className="bg-emerald-50/60">
                          <td colSpan={9} className="px-3 py-2 text-xs text-emerald-800">
                            <span className="font-semibold">{t.doctorReferrals.outcomeLabel} ({r.outcomeDate}):</span>{" "}
                            {r.outcomeNote}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {!isLoading && isError && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-3 py-10 text-center">
                      <p className="text-sm text-slate-600">{t.doctorReferrals.loadError}</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => refetch()}
                      >
                        {t.doctorReferrals.retry}
                      </Button>
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && displayed.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-slate-400">
                      {t.doctorReferrals.noReferrals}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </>
  );
}
