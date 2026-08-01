// Страница (Next.js): упатства — дел за матичен лекар (GP).
"use client";

import { motion } from "framer-motion";
import { BookOpen, Download, ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { FilterChips } from "@/components/common/FilterChips";
import { PageBanner } from "@/components/layout/PageBanner";
import { cn } from "@/utils/cn";

const CATEGORIES = ["Сите", "Интерна медицина", "Хирургија", "Педијатрија", "Кардиологија", "Итна помош"];

const GUIDELINES = [
  {
    id: "UP-001",
    title: "Протокол за артериска хипертензија",
    category: "Интерна медицина",
    version: "v3.2",
    updated: "Март 2026",
    description: "Дијагностички и терапевтски алгоритам за примарна и секундарна хипертензија.",
    tags: ["I10", "I15"],
  },
  {
    id: "UP-002",
    title: "Упатство за управување со дијабетес тип 2",
    category: "Интерна медицина",
    version: "v2.1",
    updated: "Февруари 2026",
    description: "Следење на гликемија, изборот на орален антидијабетик и инсулинска терапија.",
    tags: ["E11"],
  },
  {
    id: "UP-003",
    title: "Клинички пат за акутен коронарен синдром",
    category: "Кардиологија",
    version: "v4.0",
    updated: "Јануари 2026",
    description: "Тријажа, ЕКГ интерпретација, антикоагулантна терапија и индикации за катетеризација.",
    tags: ["I21", "I22", "I20"],
  },
  {
    id: "UP-004",
    title: "Протокол за итна реанимација (BLS/ALS)",
    category: "Итна помош",
    version: "v5.1",
    updated: "Јануари 2026",
    description: "Ажуриран ERC 2021 алгоритам за кардиопулмонална реанимација.",
    tags: ["I46"],
  },
  {
    id: "UP-005",
    title: "Предоперативна подготовка на пациент",
    category: "Хирургија",
    version: "v2.3",
    updated: "Декември 2025",
    description: "Лабораториски панел, анестезиолошка проценка и согласност за операција.",
    tags: ["Z01.8"],
  },
  {
    id: "UP-006",
    title: "Скали и менаџмент за процена на болка кај деца",
    category: "Педијатрија",
    version: "v1.4",
    updated: "Ноември 2025",
    description: "Употреба на FLACC, FACES и NRS скали; аналгетски степенести пристап.",
    tags: ["R52"],
  },
  {
    id: "UP-007",
    title: "Антибиотска политика на болницата 2026",
    category: "Интерна медицина",
    version: "v2026.1",
    updated: "Januari 2026",
    description: "Прва линија на терапија, ескалација и деескалација за вообичаени инфекции.",
    tags: ["J06", "J18", "N39"],
  },
  {
    id: "UP-008",
    title: "Упатство за новороденечка реанимација",
    category: "Педијатрија",
    version: "v3.0",
    updated: "Октомври 2025",
    description: "NRP алгоритам, интубација и медикаментозна поддршка кај новороденче.",
    tags: ["P21"],
  },
];

export default function GuidelinesPage() {
  const [category, setCategory] = useState("Сите");
  const [search, setSearch] = useState("");

  const filtered = GUIDELINES.filter((g) => {
    if (category !== "Сите" && g.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return g.title.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <>
      <PageBanner title="Упатства" breadcrumb={[{ label: "Упатства" }]} />

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-5">
        {/* Search + category strip */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пребарај по наслов или МКБ10 код…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <FilterChips
            label="Категорија"
            hideLabel
            value={category}
            onChange={setCategory}
            size="md"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>

        {/* Count */}
        <p className="text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? "упатство" : "упатства"}
        </p>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((g) => (
            <motion.div
              key={g.id}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 leading-snug">{g.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {g.category} · {g.version} · Ажурирано {g.updated}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    title="Преземи PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    title="Отвори"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">{g.description}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {g.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
}
