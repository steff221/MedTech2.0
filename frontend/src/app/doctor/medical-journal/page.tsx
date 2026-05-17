"use client";

import { motion } from "framer-motion";
import { FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { PageBanner } from "@/components/layout/PageBanner";
import { useAuth } from "@/hooks/useAuth";

const RESOURCES = [
  "Ординација 1",
  "Ординација 2",
  "Лабораторија",
  "Дијагностика",
  "Интернистички кабинет",
];

export default function MedicalJournalPage() {
  const { user } = useAuth();
  const [resource, setResource] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [search, setSearch] = useState("");

  return (
    <>
      <PageBanner
        title="Медицински дневник"
        breadcrumb={[{ label: "Медицински дневник" }]}
      />

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-5">
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <EmptyState
            icon={FileText}
            title="Нема податоци за избраниот лекар и датум"
            description="Изберете датум и ресурс, потоа кликнете „Генерирај дневник“ за да го прикажете медицинскиот дневник за тој ден."
          />
        </motion.div>
      </div>
    </>
  );
}
