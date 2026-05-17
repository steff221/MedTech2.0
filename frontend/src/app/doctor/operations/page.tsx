"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { PageBanner } from "@/components/layout/PageBanner";
import { useAuth } from "@/hooks/useAuth";

const COLUMNS = [
  "Податок за пациент",
  "Број на упат",
  "Лекар",
  "Тип на операција",
  "Операциона сала",
  "План за операција",
  "Детали",
  "Статус",
];

const ROOMS = ["Сала 1 (Општа)", "Сала 2 (Лапароскопска)", "Сала 3 (Кардиохирургија)", "Дневна болница"];
const TYPES = ["Сите", "Општа", "Лапароскопска", "Кардио", "Гинеколошка", "Ортопедска"];

export default function OperationsPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [type, setType] = useState("Сите");
  const [room, setRoom] = useState<string | null>(null);

  return (
    <>
      <PageBanner title="Операции" breadcrumb={[{ label: "Операции" }]} />

      <div className="mx-auto max-w-7xl space-y-5 px-6 py-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          {/* Left filter card */}
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Лекар</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {user ? `Dr. ${user.firstName} ${user.lastName}` : "—"}
            </p>

            <div className="mt-4">
              <p className="mb-1.5 block text-sm font-medium text-slate-700">Одделение</p>
              <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option>Сите одделенија</option>
                <option>Кардиологија</option>
                <option>Хирургија</option>
                <option>Ортопедија</option>
              </select>
            </div>

            <div className="mt-3">
              <p className="mb-1.5 block text-sm font-medium text-slate-700">Операција</p>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <p className="mb-1.5 block text-sm font-medium text-slate-700">Пребарување</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Име, Презиме, ЕМБГ, Бр.упат…"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            <Button className="mt-4" fullWidth>Барај</Button>
          </Card>

          {/* Main grid */}
          <div className="space-y-4">
            <Card>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Input label="Датум" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <div>
                  <p className="mb-1.5 block text-sm font-medium text-slate-700">Операциона сала</p>
                  <select
                    value={room ?? ""}
                    onChange={(e) => setRoom(e.target.value || null)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="">Сите сали</option>
                    {ROOMS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button variant="secondary" fullWidth>Поврати по сала</Button>
                </div>
              </div>
            </Card>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
            >
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
                    <tr>
                      <td colSpan={COLUMNS.length} className="px-4 py-10 text-center">
                        <EmptyState
                          title="Нема податоци за приказ"
                          description="Закажаните операции ќе се појават овде кога ќе бидат внесени."
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
