"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/common/Card";
import { PageBanner } from "@/components/layout/PageBanner";
import { MKB10_CATALOG } from "@/utils/mkb10";

export default function Mkb10Page() {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? MKB10_CATALOG.filter(
          (e) => e.code.toLowerCase().includes(q) || e.label.toLowerCase().includes(q),
        )
      : MKB10_CATALOG;
    const map = new Map<string, typeof MKB10_CATALOG>();
    filtered.forEach((e) => {
      const list = map.get(e.group) ?? [];
      list.push(e);
      map.set(e.group, list);
    });
    return Array.from(map.entries());
  }, [query]);

  return (
    <>
      <PageBanner title="МКБ10 Дијагноза" breadcrumb={[{ label: "МКБ10 Дијагноза" }]} />

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-5">
        <Card>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пребарај по код или име на дијагноза…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </Card>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          className="space-y-5"
        >
          {grouped.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">Нема резултати за „{query}“.</p>
            </Card>
          ) : (
            grouped.map(([group, entries]) => (
              <motion.section
                key={group}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
              >
                <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white">
                  {group}
                </div>
                <ul className="divide-y divide-slate-100">
                  {entries.map((e) => (
                    <li
                      key={e.code}
                      className="flex items-start gap-4 px-4 py-2.5 text-sm hover:bg-emerald-50/40"
                    >
                      <span className="w-20 shrink-0 rounded-md bg-rose-50 px-2 py-0.5 text-center font-mono text-xs font-bold text-rose-700">
                        {e.code}
                      </span>
                      <span className="text-slate-800">{e.label}</span>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))
          )}
        </motion.div>
      </div>
    </>
  );
}
