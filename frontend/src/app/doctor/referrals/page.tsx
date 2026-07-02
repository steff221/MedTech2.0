// Страница (Next.js): упати — дел за доктор.
"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Filter, Plus, Printer, Search, XCircle } from "lucide-react";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, parseISO } from "date-fns";
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
import type { ReferralType } from "@/types/api";

type StatusFilter = "ALL" | "active" | "completed" | "cancelled";

const TYPE_VALUES: Array<{ value: ReferralType | "ALL" }> = [
  { value: "ALL" },
  { value: "GENERAL_MEDICINE" },
  { value: "SPECIALIST" },
  { value: "LABORATORY" },
  { value: "DIAGNOSTICS" },
  { value: "HOSPITAL" },
];

function printReferral(r: ReferralRow) {
  const win = window.open("", "_blank", "width=800,height=600");
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>Упат — MedTech</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
          .header { border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
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
          <div class="ref-number">Бр. ${r.id}</div>
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
            <div class="value">${r.referralType}</div>
          </div>
          <div class="section">
            <div class="label">МКБ10</div>
            <div class="value">${r.mkb10Code !== "—" ? r.mkb10Code : "/"}</div>
          </div>
          <div class="section">
            <div class="label">Издаден на</div>
            <div class="value">${r.createdAt}</div>
          </div>
          <div class="section">
            <div class="label">Закажано за</div>
            <div class="value">${r.scheduledDate}</div>
          </div>
        </div>
        ${r.description !== "—" ? `<div class="desc"><div class="label">Причина / опис</div><div class="value" style="margin-top:6px;">${r.description}</div></div>` : ""}
        <div style="margin-top:40px;">
          <div class="label">Потпис на доктор</div>
          <div class="signature-line"></div>
        </div>
        <div class="footer">
          <span>Издадено преку MedTech платформата</span>
          <span>${r.id}</span>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
    </html>
  `);
  win.document.close();
}

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
    GENERAL_MEDICINE: t.doctorReferrals.typeGeneral,
    SPECIALIST:       t.doctorReferrals.typeSpecialist,
    LABORATORY:       t.doctorReferrals.typeLab,
    DIAGNOSTICS:      t.doctorReferrals.typeDiag,
    HOSPITAL:         t.doctorReferrals.typeHospital,
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

  const { data, isLoading } = useQuery({
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
    onError: () => toast.error("Грешка при реализирање на упат."),
  });

  const cancelMutation = useMutation({
    mutationFn: referralService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-referrals"] });
      toast.success(t.doctorReferrals.cancelSuccess);
      setCancelTarget(null);
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
    completeMutation.mutate({ id: outcomeTarget.backendId, outcomeDate, outcomeNote });
  };

  const confirmCancel = () => {
    if (!cancelTarget?.backendId) return;
    cancelMutation.mutate(cancelTarget.backendId);
  };

  const filtered = referrals.filter((r) => {
    if (typeFilter !== "ALL" && r.referralTypeValue !== typeFilter) return false;
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (dateFrom && r.scheduledDateIso < dateFrom) return false;
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

  const displayed     = filtered.slice(0, pageSize);
  const activeCount   = referrals.filter((r) => r.status === "active").length;
  const completedCount= referrals.filter((r) => r.status === "completed").length;

  function getDaysBadge(isoDate: string) {
    const days = differenceInDays(parseISO(isoDate), new Date());
    if (days === 0) return <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">Денес</span>;
    if (days < 0)   return <span className="ml-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-xs font-medium text-rose-600">+{Math.abs(days)}д</span>;
    if (days <= 3)  return <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">за {days}д</span>;
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
              disabled={cancelMutation.isPending}
              className="!bg-rose-600 hover:!bg-rose-700"
            >
              {cancelMutation.isPending ? "Се откажува…" : t.doctorReferrals.cancelConfirmBtn}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">{t.doctorReferrals.cancelConfirmDesc}</p>
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
            {/* Type filter — uses raw enum values, labels from translations */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">{t.doctorReferrals.filterType}</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_VALUES.map(({ value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTypeFilter(value)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      typeFilter === value
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                    )}
                  >
                    {TYPE_LABELS[value]}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">{t.doctorReferrals.filterStatus}</p>
              <div className="flex flex-wrap gap-1.5">
                {(["ALL", "active", "completed", "cancelled"] as StatusFilter[]).map((s) => (
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
                    {s === "ALL" ? t.common.all : STATUS_META[s as ReferralRow["status"]].label}
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
                          <Badge tone={s.tone}>{s.label}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            {/* Print — available for all */}
                            <button
                              type="button"
                              onClick={() => printReferral(r)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                              title={t.doctorReferrals.printBtn}
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">{t.doctorReferrals.printBtn}</span>
                            </button>
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
