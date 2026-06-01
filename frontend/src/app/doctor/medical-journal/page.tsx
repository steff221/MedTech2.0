"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, FileSpreadsheet, FileText, Loader2, Plus, Search, X } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { PageBanner } from "@/components/layout/PageBanner";
import { useAuth } from "@/hooks/useAuth";
import { reportService, type GenerateReportRequest } from "@/services/report.service";
import type { DoctorReportResponse, ReportPeriodType } from "@/types/api";
import { cn } from "@/utils/cn";

// ── Display helpers ───────────────────────────────────────────────────────────

const PERIOD_TYPE_LABEL: Record<ReportPeriodType, string> = {
  MONTHLY:   "Месечна пријава",
  QUARTERLY: "Тримесечна",
  ANNUAL:    "Годишна",
};

const STATUS_META: Record<string, { label: string; tone: "success" | "warning" | "info" }> = {
  SUBMITTED: { label: "Поднесена", tone: "success" },
  DRAFT:     { label: "Нацрт",     tone: "warning"  },
};

const REPORT_TYPES = ["Сите", "Месечна пријава", "Тримесечна", "Годишна"];

const RESOURCES = [
  "Ординација 1",
  "Ординација 2",
  "Лабораторија",
  "Дијагностика",
  "Интернистички кабинет",
];

// ── New report modal ──────────────────────────────────────────────────────────

const REPORT_TYPE_OPTIONS: Array<{ label: string; value: ReportPeriodType }> = [
  { label: "Месечна пријава", value: "MONTHLY"   },
  { label: "Тримесечна",      value: "QUARTERLY" },
  { label: "Годишна",         value: "ANNUAL"    },
];

const MONTHS_MK = [
  "Јануари","Февруари","Март","Април","Мај","Јуни",
  "Јули","Август","Септември","Октомври","Ноември","Декември",
];

interface NewReportModalProps {
  onClose: () => void;
  onCreated: (report: DoctorReportResponse) => void;
}

function NewReportModal({ onClose, onCreated }: NewReportModalProps) {
  const currentYear = new Date().getFullYear();
  const [periodType, setPeriodType] = useState<ReportPeriodType>("MONTHLY");
  const [month, setMonth] = useState(new Date().getMonth()); // 0-indexed
  const [quarter, setQuarter] = useState(1);
  const [year, setYear] = useState(currentYear);
  const [submitting, setSubmitting] = useState(false);

  const periodLabel = periodType === "MONTHLY"
    ? `${MONTHS_MK[month]} ${year}`
    : periodType === "QUARTERLY"
    ? `Q${quarter} ${year}`
    : `Годишна ${year}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const req: GenerateReportRequest = {
        periodType,
        year,
        periodUnit: periodType === "MONTHLY" ? month + 1
                  : periodType === "QUARTERLY" ? quarter
                  : undefined,
      };
      const created = await reportService.generate(req);
      toast.success("Пријавата е зачувана.");
      onCreated(created);
    } catch {
      toast.error("Грешка при зачувување на пријавата.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Нова пријава</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Тип на пријава</p>
            <div className="flex flex-wrap gap-1.5">
              {REPORT_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setPeriodType(opt.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                    periodType === opt.value
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {periodType === "MONTHLY" && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Месец</p>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  {MONTHS_MK.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </div>
            )}
            {periodType === "QUARTERLY" && (
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Квартал</p>
                <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  {[1, 2, 3, 4].map((q) => <option key={q} value={q}>Q{q}</option>)}
                </select>
              </div>
            )}
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Година</p>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
            <span className="text-slate-500">Период: </span>
            <span className="font-semibold text-slate-800">{periodLabel}</span>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Откажи</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Зачувај нацрт"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MedicalJournalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showNewReport, setShowNewReport] = useState(false);
  const [resource, setResource] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [journalSearch, setJournalSearch] = useState("");
  const [reportType, setReportType] = useState("Сите");
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportSearch, setReportSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-reports"],
    queryFn: () => reportService.myReports(0, 200),
    staleTime: 2 * 60 * 1000,
  });

  const allReports = useMemo<DoctorReportResponse[]>(
    () => data?.content ?? [],
    [data],
  );

  const filteredReports = useMemo(() => {
    return allReports.filter((r) => {
      const typeLabel = PERIOD_TYPE_LABEL[r.periodType];
      if (reportType !== "Сите" && typeLabel !== reportType) return false;
      if (!r.periodLabel.includes(reportYear) && !r.periodStart.startsWith(reportYear)) return false;
      if (reportSearch) {
        const q = reportSearch.toLowerCase();
        if (!r.periodLabel.toLowerCase().includes(q) && !r.reportNumber.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allReports, reportType, reportYear, reportSearch]);

  // Stats computed from real data for the current year
  const yearReports = allReports.filter((r) => r.periodStart.startsWith(reportYear));
  const totalPatients   = yearReports.reduce((s, r) => s + r.patientCount, 0);
  const totalDiagnoses  = yearReports.reduce((s, r) => s + r.diagnosisCount, 0);
  const lastReport      = yearReports[0]?.periodLabel ?? "—";

  return (
    <>
      <PageBanner
        title="Медицински дневник"
        breadcrumb={[{ label: "Медицински дневник" }]}
        actions={
          <Button onClick={() => setShowNewReport(true)} className="bg-white !text-emerald-700 hover:!bg-emerald-50">
            <Plus className="h-4 w-4" /> Нова пријава
          </Button>
        }
      />

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-6">

        {/* ── Journal generator ─────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Генерирај дневник
          </h2>
          <Card>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Лекар</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {user ? `Dr. ${user.firstName} ${user.lastName}` : "—"}
                </p>
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Датум"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <p className="mb-1.5 block text-sm font-medium text-slate-700">Ресурс</p>
                <select
                  value={resource ?? ""}
                  onChange={(e) => setResource(e.target.value || null)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">Сите ресурси</option>
                  {RESOURCES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end md:col-span-3">
                <Button fullWidth>
                  <FileText className="h-4 w-4" /> Генерирај дневник
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1.5 block text-sm font-medium text-slate-700">Пребарување</p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={journalSearch}
                    onChange={(e) => setJournalSearch(e.target.value)}
                    placeholder="Име, Презиме, ЕМБГ…"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button variant="secondary" fullWidth>Пребарај</Button>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Individual reports ────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Индивидуални пријави
          </h2>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {[
              { label: "Пријави оваа година", value: String(yearReports.length) },
              { label: "Вкупно пациенти",     value: String(totalPatients)       },
              { label: "Вкупно дијагнози",    value: String(totalDiagnoses)      },
              { label: "Последна пријава",    value: lastReport                  },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            ))}
          </motion.div>

          <Card className="mb-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Тип на пријава</p>
                <div className="flex flex-wrap gap-1.5">
                  {REPORT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReportType(t)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                        reportType === t
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Година</p>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {["2026", "2025", "2024"].map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Пребарување</p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Период, број на пријава…"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>
            </div>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      {["Број", "Период", "Тип", "Пациенти", "Дијагнози", "Поднесено", "Статус", ""].map((c) => (
                        <th key={c} className="border-b border-slate-200 px-4 py-2.5 text-left font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r, i) => {
                      const s = STATUS_META[r.status] ?? { label: r.status, tone: "info" as const };
                      return (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-slate-100 hover:bg-emerald-50/40"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.reportNumber}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{r.periodLabel}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-slate-700">
                              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                              {PERIOD_TYPE_LABEL[r.periodType]}
                            </span>
                          </td>
                          <td className="px-4 py-3 tabular-nums text-slate-700">{r.patientCount}</td>
                          <td className="px-4 py-3 tabular-nums text-slate-700">{r.diagnosisCount}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {r.submittedAt ? format(new Date(r.submittedAt), "dd.MM.yyyy") : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={s.tone}>{s.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toast("PDF генерирање наскоро.")}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Download className="h-3.5 w-3.5" /> PDF
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                    {filteredReports.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">
                          Нема пријави за избраните филтри.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </section>
      </div>

      <AnimatePresence>
        {showNewReport && (
          <NewReportModal
            onClose={() => setShowNewReport(false)}
            onCreated={(r) => {
              queryClient.invalidateQueries({ queryKey: ["doctor-reports"] });
              setShowNewReport(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
