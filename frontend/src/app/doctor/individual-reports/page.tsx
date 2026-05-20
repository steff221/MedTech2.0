"use client";

import { motion } from "framer-motion";
import { Download, FileSpreadsheet, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { PageBanner } from "@/components/layout/PageBanner";
import { cn } from "@/utils/cn";

const MONTHS = [
  "Јануари", "Февруари", "Март", "Април", "Мај", "Јуни",
  "Јули", "Август", "Септември", "Октомври", "Ноември", "Декември",
];

const TYPES = ["Сите", "Месечна пријава", "Тримесечна", "Годишна"];

const MOCK_REPORTS = [
  { id: "IP-2026-005", period: "Мај 2026",      type: "Месечна пријава",  patients: 38, diagnoses: 52, submitted: "01.06.2026", status: "submitted" },
  { id: "IP-2026-004", period: "Април 2026",    type: "Месечна пријава",  patients: 41, diagnoses: 58, submitted: "02.05.2026", status: "submitted" },
  { id: "IP-2026-Q1",  period: "Q1 2026",       type: "Тримесечна",       patients: 112, diagnoses: 147, submitted: "05.04.2026", status: "submitted" },
  { id: "IP-2026-003", period: "Март 2026",     type: "Месечна пријава",  patients: 35, diagnoses: 44, submitted: "31.03.2026", status: "submitted" },
  { id: "IP-2026-002", period: "Февруари 2026", type: "Месечна пријава",  patients: 29, diagnoses: 37, submitted: "28.02.2026", status: "submitted" },
  { id: "IP-2026-001", period: "Јануари 2026",  type: "Месечна пријава",  patients: 33, diagnoses: 41, submitted: "30.01.2026", status: "submitted" },
  { id: "IP-2025-12",  period: "Декември 2025", type: "Месечна пријава",  patients: 27, diagnoses: 34, submitted: "—",          status: "draft"     },
];

const statusLabel: Record<string, { label: string; tone: "success" | "warning" | "info" }> = {
  submitted: { label: "Поднесена",  tone: "success" },
  draft:     { label: "Нацрт",      tone: "warning"  },
  pending:   { label: "На чекање",  tone: "info"     },
};

export default function IndividualReportsPage() {
  const [type, setType] = useState("Сите");
  const [year, setYear] = useState("2026");
  const [search, setSearch] = useState("");

  const filtered = MOCK_REPORTS.filter((r) => {
    if (type !== "Сите" && r.type !== type) return false;
    if (!r.period.includes(year)) return false;
    if (search && !r.period.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <PageBanner
        title="Индивидуални пријави"
        breadcrumb={[{ label: "Индивидуални пријави" }]}
        actions={
          <Button className="bg-white !text-emerald-700 hover:!bg-emerald-50">
            <Plus className="h-4 w-4" /> Нова пријава
          </Button>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-5">
        {/* Summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { label: "Пријави оваа година", value: "6" },
            { label: "Вкупно пациенти",     value: "288" },
            { label: "Вкупно дијагнози",    value: "379" },
            { label: "Последна пријава",    value: "Мај 2026" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Тип на пријава</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      type === t
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
                value={year}
                onChange={(e) => setYear(e.target.value)}
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                {filtered.map((r, i) => {
                  const s = statusLabel[r.status];
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
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </>
  );
}
