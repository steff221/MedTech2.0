"use client";

import { motion } from "framer-motion";
import { Calendar, Filter, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { PageBanner } from "@/components/layout/PageBanner";
import { cn } from "@/utils/cn";

const COLUMNS = [
  "Креирано на",
  "Закажана за",
  "Се упатува кон",
  "Пациент",
  "Тип на упат",
  "МКБ10 Дијагноза",
  "Опис",
  "Статус",
  "Реализиран",
  "Контрола",
];

const TYPES = ["Сите", "Општа медицина", "Специјалист", "Лабораторија", "Дијагностика", "Болница"];

export default function ReferralsPage() {
  const [type, setType] = useState("Сите");

  return (
    <>
      <PageBanner
        title="Издадени упати"
        breadcrumb={[{ label: "Упати" }, { label: "Издадени упати" }]}
        actions={
          <Button className="bg-white !text-emerald-700 hover:!bg-emerald-50">
            <Plus className="h-4 w-4" /> Нов упат
          </Button>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Filter strip */}
        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Filter className="h-4 w-4" /> Филтри
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <p className="mb-1.5 block text-sm font-medium text-slate-700">Тип на упат</p>
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      type === t
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Од датум" type="date" />
            <Input label="До датум" type="date" />
            <div>
              <p className="mb-1.5 block text-sm font-medium text-slate-700">Пребарување</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Име, Презиме, ЕМБГ, Бр.упат…"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button>Барај</Button>
          </div>
        </Card>

        {/* Results table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Резултати
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Број на редици:</span>
              <select className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs">
                <option>10</option>
                <option>25</option>
                <option>50</option>
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
                {/* Demo placeholder rows */}
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-emerald-50/40">
                    <td className="px-3 py-2 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        17.05.2026
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">20.05.2026</td>
                    <td className="px-3 py-2 text-slate-700">Кардиолог</td>
                    <td className="px-3 py-2 font-medium text-slate-900">Демо Пациент {i}</td>
                    <td className="px-3 py-2 text-slate-700">Специјалист</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">I10</td>
                    <td className="px-3 py-2 text-slate-600">Контрола на тензија</td>
                    <td className="px-3 py-2">
                      <Badge tone="info">Активен</Badge>
                    </td>
                    <td className="px-3 py-2 text-slate-500">—</td>
                    <td className="px-3 py-2 text-slate-500">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <EmptyState
              title="Демо приказ"
              description="Целосниот тек на упатите доаѓа во следна верзија — таблицата прикажува три демо записи за да го видите изгледот."
            />
          </div>
        </motion.div>
      </div>
    </>
  );
}
