"use client";

import { motion } from "framer-motion";
import { Download, FileSpreadsheet, FileText, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { PageBanner } from "@/components/layout/PageBanner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

// ── Mock report data ──────────────────────────────────────────────────────────
const REPORT_TYPES = ["Сите", "Месечна пријава", "Тримесечна", "Годишна"];

const MOCK_REPORTS = [
  { id: "IP-2026-005", period: "Мај 2026",      type: "Месечна пријава", patients: 38,  diagnoses: 52,  submitted: "01.06.2026", status: "submitted" },
  { id: "IP-2026-004", period: "Април 2026",    type: "Месечна пријава", patients: 41,  diagnoses: 58,  submitted: "02.05.2026", status: "submitted" },
  { id: "IP-2026-Q1",  period: "Q1 2026",       type: "Тримесечна",      patients: 112, diagnoses: 147, submitted: "05.04.2026", status: "submitted" },
  { id: "IP-2026-003", period: "Март 2026",     type: "Месечна пријава", patients: 35,  diagnoses: 44,  submitted: "31.03.2026", status: "submitted" },
  { id: "IP-2026-002", period: "Февруари 2026", type: "Месечна пријава", patients: 29,  diagnoses: 37,  submitted: "28.02.2026", status: "submitted" },
  { id: "IP-2026-001", period: "Јануари 2026",  type: "Месечна пријава", patients: 33,  diagnoses: 41,  submitted: "30.01.2026", status: "submitted" },
  { id: "IP-2025-12",  period: "Декември 2025", type: "Месечна пријава", patients: 27,  diagnoses: 34,  submitted: "—",          status: "draft"     },
];

const STATUS_META: Record<string, { label: string; tone: "success" | "warning" | "info" }> = {
  submitted: { label: "Поднесена", tone: "success" },
  draft:     { label: "Нацрт",     tone: "warning"  },
  pending:   { label: "На чекање", tone: "info"     },
};

const RESOURCES = [
  "Ординација 1",
  "Ординација 2",
  "Лабораторија",
  "Дијагностика",
  "Интернистички кабинет",
];

export default function MedicalJournalPage() {
  const { user } = useAuth();

  // Journal generator state
  const [resource, setResource] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [journalSearch, setJournalSearch] = useState("");

  // Reports state
  const [reportType, setReportType] = useState("Сите");
  const [reportYear, setReportYear] = useState("2026");
  const [reportSearch, setReportSearch] = useState("");

  const filteredReports = MOCK_REPORTS.filter((r) => {
    if (reportType !== "Сите" && r.type !== reportType) return false;
    if (!r.period.includes(reportYear)) return false;
    if (
      reportSearch &&
      !r.period.toLowerCase().includes(reportSearch.toLowerCase()) &&
      !r.id.toLowerCase().includes(reportSearch.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <>
      <PageBanner
        title="Медицински дневник"
        breadcrumb={[{ label: "Медицински дневник" }]}
        actions={
          <Button className="bg-white !text-emerald-700 hover:!bg-emerald-50">
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

          {/* Summary stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {[
              { label: "Пријави оваа година", value: "6"        },
              { label: "Вкупно пациенти",     value: "288"      },
              { label: "Вкупно дијагнози",    value: "379"      },
              { label: "Последна пријава",    value: "Мај 2026" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Filters */}
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

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
          >
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
                    const s = STATUS_META[r.status];
                    return (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-slate-100 hover:bg-emerald-50/40"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.id}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{r.period}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-slate-700">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                            {r.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{r.patients}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{r.diagnoses}</td>
                        <td className="px-4 py-3 text-slate-500">{r.submitted}</td>
                        <td className="px-4 py-3">
                          <Badge tone={s.tone}>{s.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
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
          </motion.div>
        </section>
      </div>
    </>
  );
}
