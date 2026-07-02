// Страница (Next.js): поединечни извештаи — дел за доктор.
"use client";

import { motion } from "framer-motion";
import { Download, FileSpreadsheet, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { PageBanner } from "@/components/layout/PageBanner";
import { Skeleton } from "@/components/common/Skeleton";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { reportService, type GenerateReportRequest } from "@/services/report.service";
import type { DoctorReportResponse, ReportPeriodType } from "@/types/api";

const MONTHS_MK = [
  "Јануари","Февруари","Март","Април","Мај","Јуни",
  "Јули","Август","Септември","Октомври","Ноември","Декември",
];

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => THIS_YEAR - i);

// ── Generate modal ─────────────────────────────────────────────────────────────
function GenerateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t  = useT();
  const ir = t.individualReports;
  const [periodType, setPeriodType] = useState<ReportPeriodType>("MONTHLY");
  const [year, setYear]             = useState(THIS_YEAR);
  const [unit, setUnit]             = useState(new Date().getMonth() + 1);

  const mutation = useMutation({
    mutationFn: (req: GenerateReportRequest) => reportService.generate(req),
    onSuccess: () => { onCreated(); onClose(); },
  });

  function submit() {
    mutation.mutate({ periodType, year, periodUnit: periodType !== "ANNUAL" ? unit : undefined });
  }

  const unitOptions = periodType === "MONTHLY"
    ? MONTHS_MK.map((m, i) => ({ value: i + 1, label: m }))
    : periodType === "QUARTERLY"
    ? [1, 2, 3, 4].map((q) => ({ value: q, label: `Q${q}` }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold text-slate-900">{ir.generateTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{ir.generateSubtitle}</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{ir.typeLabel}</label>
            <div className="flex gap-2">
              {(["MONTHLY", "QUARTERLY", "ANNUAL"] as ReportPeriodType[]).map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => { setPeriodType(pt); setUnit(pt === "MONTHLY" ? new Date().getMonth() + 1 : 1); }}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    periodType === pt
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300",
                  )}
                >
                  {pt === "MONTHLY" ? ir.monthly : pt === "QUARTERLY" ? ir.quarterly : ir.annual}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">{ir.yearLabel}</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {periodType !== "ANNUAL" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {periodType === "MONTHLY" ? ir.monthLabel : ir.quarterLabel}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {unitOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {mutation.error && (
          <p className="mt-3 text-sm text-red-600">
            {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? ir.generateError}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            {ir.cancelBtn}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={mutation.isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {mutation.isPending ? ir.generatingBtn : ir.generateBtn}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function IndividualReportsPage() {
  const t  = useT();
  const ir = t.individualReports;
  const qc = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<ReportPeriodType | "ALL">("ALL");
  const [yearFilter, setYearFilter] = useState(String(THIS_YEAR));
  const [search, setSearch]         = useState("");
  const [showModal, setShowModal]   = useState(false);

  const PERIOD_TYPES: { value: ReportPeriodType | "ALL"; label: string }[] = [
    { value: "ALL",       label: t.common.all },
    { value: "MONTHLY",   label: ir.monthly   },
    { value: "QUARTERLY", label: ir.quarterly },
    { value: "ANNUAL",    label: ir.annual    },
  ];

  const STATUS_BADGE: Record<string, { label: string; tone: "success" | "warning" }> = {
    SUBMITTED: { label: ir.statusSubmitted, tone: "success" },
    DRAFT:     { label: ir.statusDraft,     tone: "warning"  },
  };

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-reports"],
    queryFn: () => reportService.myReports(0, 200),
    staleTime: 5 * 60_000,
  });

  const all = useMemo(() => data?.content ?? [], [data]);

  const filtered = useMemo(() => all.filter((r) => {
    if (typeFilter !== "ALL" && r.periodType !== typeFilter) return false;
    if (!r.periodLabel.includes(yearFilter)) return false;
    if (search && !r.periodLabel.toLowerCase().includes(search.toLowerCase())
               && !r.reportNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [all, typeFilter, yearFilter, search]);

  const summary = useMemo(() => {
    const thisYear = all.filter((r) => r.periodLabel.includes(String(THIS_YEAR)));
    return {
      count:      thisYear.length,
      patients:   thisYear.reduce((s, r) => s + r.patientCount, 0),
      diagnoses:  thisYear.reduce((s, r) => s + r.diagnosisCount, 0),
      lastPeriod: thisYear[0]?.periodLabel ?? "—",
    };
  }, [all]);

  const submitMutation = useMutation({
    mutationFn: (id: number) => reportService.submit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor-reports"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reportService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor-reports"] }),
  });

  const COLUMNS = [
    ir.colNumber, ir.colPeriod, ir.colType, ir.colPatients,
    ir.colDiagnoses, ir.colAppts, ir.colPrescriptions, ir.colGenerated, ir.colStatus, "",
  ];

  return (
    <>
      {showModal && (
        <GenerateModal
          onClose={() => setShowModal(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["doctor-reports"] })}
        />
      )}

      <PageBanner
        title={ir.title}
        breadcrumb={[{ label: ir.title }]}
        actions={
          <Button onClick={() => setShowModal(true)} className="bg-white !text-emerald-700 hover:!bg-emerald-50">
            <Plus className="h-4 w-4" /> {ir.newBtn}
          </Button>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-5">
        {/* Summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
            : [
                { label: `${ir.statsYear} ${THIS_YEAR}`, value: summary.count       },
                { label: ir.statsPatients,                value: summary.patients    },
                { label: ir.statsDiagnoses,               value: summary.diagnoses   },
                { label: ir.statsLastPeriod,              value: summary.lastPeriod  },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="mt-1.5 text-2xl font-bold text-slate-900">{s.value}</p>
                </div>
              ))
          }
        </motion.div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">{ir.filterTypeLabel}</p>
              <div className="flex flex-wrap gap-1.5">
                {PERIOD_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTypeFilter(value)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      typeFilter === value
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">{ir.filterYearLabel}</p>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">{ir.filterSearchLabel}</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={ir.filterSearchPlaceholder}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c} className="border-b border-slate-200 px-4 py-2.5 text-left font-semibold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        {Array.from({ length: 10 }).map((__, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-sm text-slate-400">{ir.noReports}</td>
                    </tr>
                  )
                  : filtered.map((r, i) => (
                    <ReportRow
                      key={r.id}
                      report={r}
                      index={i}
                      statusBadge={STATUS_BADGE}
                      typeLabels={{ MONTHLY: ir.monthly, QUARTERLY: ir.quarterly, ANNUAL: ir.annual }}
                      submitLabel={ir.submitBtn}
                      onSubmit={() => submitMutation.mutate(r.id)}
                      onDelete={() => deleteMutation.mutate(r.id)}
                    />
                  ))
                }
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function printReport(r: DoctorReportResponse, typeLabel: string, statusSubmitted: string, statusDraft: string) {
  const win = window.open("", "_blank", "width=800,height=700");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>Пријава ${r.reportNumber}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:40px;color:#1e293b;max-width:700px;margin:0 auto}
      h1{font-size:22px;margin-bottom:4px}
      .sub{color:#64748b;font-size:13px;margin-bottom:32px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;padding:8px 12px;border-bottom:2px solid #e2e8f0}
      td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px}
      .row-label{font-weight:600;color:#334155}
      .footer{margin-top:40px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}
      @media print{body{padding:20px}}
    </style>
  </head><body>
    <h1>Индивидуална лекарска пријава</h1>
    <p class="sub">${typeLabel} пријава · ${r.reportNumber} · ${r.periodLabel}</p>
    <table>
      <thead><tr><th>Параметар</th><th>Вредност</th></tr></thead>
      <tbody>
        <tr><td class="row-label">Период</td><td>${r.periodStart} – ${r.periodEnd}</td></tr>
        <tr><td class="row-label">Број на пациенти</td><td>${r.patientCount}</td></tr>
        <tr><td class="row-label">Број на дијагнози</td><td>${r.diagnosisCount}</td></tr>
        <tr><td class="row-label">Број на термини</td><td>${r.appointmentCount}</td></tr>
        <tr><td class="row-label">Број на рецепти</td><td>${r.prescriptionCount}</td></tr>
        <tr><td class="row-label">Статус</td><td>${r.status === "SUBMITTED" ? statusSubmitted : statusDraft}</td></tr>
        ${r.submittedAt ? `<tr><td class="row-label">Поднесена на</td><td>${format(parseISO(r.submittedAt), "dd.MM.yyyy HH:mm")}</td></tr>` : ""}
      </tbody>
    </table>
    <div class="footer">MedTech 2.0 · Генерирано: ${format(new Date(), "dd.MM.yyyy HH:mm")}</div>
    <script>window.onload=()=>{window.print();window.close()}</script>
  </body></html>`);
  win.document.close();
}

function ReportRow({
  report: r, index, statusBadge, typeLabels, submitLabel, onSubmit, onDelete,
}: {
  report: DoctorReportResponse;
  index: number;
  statusBadge: Record<string, { label: string; tone: "success" | "warning" }>;
  typeLabels: Record<ReportPeriodType, string>;
  submitLabel: string;
  onSubmit: () => void;
  onDelete: () => void;
}) {
  const s = statusBadge[r.status];
  const typeLabel = typeLabels[r.periodType];

  return (
    <motion.tr
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.04 }}
      className="border-b border-slate-100 hover:bg-emerald-50/40"
    >
      <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.reportNumber}</td>
      <td className="px-4 py-3 font-medium text-slate-900">{r.periodLabel}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-slate-700">
          <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
          {typeLabel}
        </span>
      </td>
      <td className="px-4 py-3 tabular-nums text-slate-700">{r.patientCount}</td>
      <td className="px-4 py-3 tabular-nums text-slate-700">{r.diagnosisCount}</td>
      <td className="px-4 py-3 tabular-nums text-slate-700">{r.appointmentCount}</td>
      <td className="px-4 py-3 tabular-nums text-slate-700">{r.prescriptionCount}</td>
      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
        {format(parseISO(r.createdAt), "dd.MM.yyyy")}
      </td>
      <td className="px-4 py-3"><Badge tone={s.tone}>{s.label}</Badge></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {r.status === "DRAFT" && (
            <>
              <button type="button" onClick={onSubmit} className="rounded-md px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50">
                {submitLabel}
              </button>
              <button type="button" onClick={onDelete} className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {r.status === "SUBMITTED" && (
            <button
              type="button"
              onClick={() => printReport(r, typeLabel, statusBadge.SUBMITTED?.label ?? "", statusBadge.DRAFT?.label ?? "")}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}
