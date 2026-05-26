"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Filter, Plus, Search, XCircle } from "lucide-react";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { PageBanner } from "@/components/layout/PageBanner";
import { Skeleton } from "@/components/common/Skeleton";
import { NewReferralForm, referralResponseToRow, type ReferralRow } from "@/components/doctor/NewReferralForm";
import { referralService } from "@/services/referral.service";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

const TYPES = ["Сите", "Општа медицина", "Специјалист", "Лабораторија", "Дијагностика", "Болница"];


type StatusFilter = "Сите" | "active" | "completed" | "cancelled";

export default function ReferralsPage() {
  const t = useT();
  const queryClient = useQueryClient();

  const STATUS_META: Record<ReferralRow["status"], { label: string; tone: "info" | "success" | "neutral" }> = {
    active:    { label: t.doctorReferrals.statusActive,    tone: "info"    },
    completed: { label: t.doctorReferrals.statusCompleted, tone: "success" },
    cancelled: { label: t.doctorReferrals.statusCancelled, tone: "neutral" },
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
  const [type, setType]                 = useState("Сите");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Сите");
  const [dateFrom, setDateFrom]         = useState("");
  const [search, setSearch]             = useState("");
  const [pageSize, setPageSize]         = useState(10);

  // Outcome modal state
  const [outcomeTarget, setOutcomeTarget] = useState<ReferralRow | null>(null);
  const [outcomeNote, setOutcomeNote]     = useState("");
  const [outcomeDate, setOutcomeDate]     = useState(new Date().toISOString().slice(0, 10));

  // Fetch referrals from backend
  const { data, isLoading } = useQuery({
    queryKey: ["doctor-referrals"],
    queryFn:  () => referralService.myReferrals(undefined, 0, 200),
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
    onError: () => toast.error("Грешка при реализирање на упат."),
  });

  const cancelMutation = useMutation({
    mutationFn: referralService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-referrals"] });
      toast.success(t.doctorReferrals.cancelSuccess);
    },
    onError: () => toast.error("Грешка при откажување на упат."),
  });

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
    completeMutation.mutate({
      id:          outcomeTarget.backendId,
      outcomeDate: outcomeDate,
      outcomeNote: outcomeNote,
    });
  };

  const cancelReferral = (r: ReferralRow) => {
    if (!r.backendId) return;
    cancelMutation.mutate(r.backendId);
  };

  const filtered = referrals.filter((r) => {
    if (type !== "Сите" && r.referralType !== type) return false;
    if (statusFilter !== "Сите" && r.status !== statusFilter) return false;
    if (dateFrom && r.scheduledDate < dateFrom.split("-").reverse().join(".")) return false;
    if (
      search &&
      !r.patientName.toLowerCase().includes(search.toLowerCase()) &&
      !r.referredTo.toLowerCase().includes(search.toLowerCase()) &&
      !r.id.toLowerCase().includes(search.toLowerCase()) &&
      !r.mkb10Code.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const displayed = filtered.slice(0, pageSize);

  const activeCount    = referrals.filter((r) => r.status === "active").length;
  const completedCount = referrals.filter((r) => r.status === "completed").length;

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
                {isLoading ? <Skeleton className="h-7 w-12" /> : s.value}
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
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">{t.doctorReferrals.filterType}</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((typeKey) => (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setType(typeKey)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      type === typeKey
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                    )}
                  >
                    {typeKey === "Сите" ? t.common.all : typeKey}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">{t.doctorReferrals.filterStatus}</p>
              <div className="flex flex-wrap gap-1.5">
                {(["Сите", "active", "completed", "cancelled"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      statusFilter === s
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                    )}
                  >
                    {s === "Сите" ? t.common.all : STATUS_META[s as ReferralRow["status"]].label}
                  </button>
                ))}
              </div>
            </div>
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
              onClick={() => { setType("Сите"); setStatusFilter("Сите"); setDateFrom(""); setSearch(""); }}
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
                        <td className="px-3 py-2.5 text-slate-700">{r.scheduledDate}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">{r.referredTo}</td>
                        <td className="px-3 py-2.5 text-slate-700">{r.patientName}</td>
                        <td className="px-3 py-2.5 text-slate-700">{r.referralType}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-700">{r.mkb10Code}</td>
                        <td className="max-w-[180px] truncate px-3 py-2.5 text-slate-600">{r.description}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone={s.tone}>{s.label}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          {r.status === "active" && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openOutcomeModal(r)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                                title="Реализирај"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelReferral(r)}
                                disabled={cancelMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50 disabled:opacity-50"
                                title="Откажи"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
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

                {!isLoading && displayed.length === 0 && (
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
