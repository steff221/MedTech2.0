// React компонента: прелистувач на МКБ-10 каталог.
"use client";

import { motion } from "framer-motion";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/common/Card";
import { PageBanner } from "@/components/layout/PageBanner";
import { icd10Service } from "@/services/icd10.service";
import { cn } from "@/utils/cn";
import type { Icd10ChapterResponse, Icd10CodeResponse } from "@/types/api";

const ROMAN = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI",
  "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII",
];

const SEARCH_LIMIT = 100;
const DEBOUNCE_MS = 300;

function CodeRow({ entry }: { entry: Icd10CodeResponse }) {
  return (
    <li
      className={cn(
        "flex items-start gap-4 px-4 py-2.5 text-sm hover:bg-emerald-50/40",
        !entry.terminal && "bg-slate-50/60",
      )}
    >
      <span
        className={cn(
          "w-20 shrink-0 rounded-md px-2 py-0.5 text-center font-mono text-xs font-bold",
          entry.terminal ? "bg-rose-50 text-rose-700" : "bg-slate-200 text-slate-600",
        )}
      >
        {entry.code}
      </span>
      <span className={cn("text-slate-800", !entry.terminal && "font-semibold")}>{entry.title}</span>
    </li>
  );
}

/**
 * Browser over the complete WHO ICD-10 2019 (MKB-10) catalog — all 12 221
 * codes in 22 chapters, served by the backend. Search queries the full
 * catalog; without a query the chapters are browsable as accordions.
 */
export function Mkb10Browser() {
  const [query, setQuery] = useState("");
  const [chapters, setChapters] = useState<Icd10ChapterResponse[]>([]);
  const [openChapter, setOpenChapter] = useState<number | null>(null);
  const [chapterCodes, setChapterCodes] = useState<Record<number, Icd10CodeResponse[]>>({});
  const [results, setResults] = useState<Icd10CodeResponse[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    icd10Service.chapters().then(setChapters).catch(() => setChapters([]));
  }, []);

  // Debounced full-catalog search; empty query returns to chapter browsing.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      icd10Service
        .search(q, SEARCH_LIMIT)
        .then((r) => {
          if (!cancelled) setResults(r);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const toggleChapter = (no: number) => {
    setOpenChapter((cur) => (cur === no ? null : no));
    if (!chapterCodes[no]) {
      icd10Service
        .chapterCodes(no)
        .then((codes) => setChapterCodes((prev) => ({ ...prev, [no]: codes })))
        .catch(() => undefined);
    }
  };

  const groupedResults = (results ?? []).reduce<Array<{ group: string; entries: Icd10CodeResponse[] }>>(
    (acc, e) => {
      const last = acc[acc.length - 1];
      const label = `${e.group} ${e.groupTitle}`;
      if (last && last.group === label) last.entries.push(e);
      else acc.push({ group: label, entries: [e] });
      return acc;
    },
    [],
  );

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
              placeholder="Пребарај низ 12.221 СЗО МКБ-10 кодови (код или име на дијагноза)…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Целосен каталог: СЗО МКБ-10, издание 2019 ({chapters.reduce((s, c) => s + c.codeCount, 0) || "…"} кодови)
          </p>
        </Card>

        {results !== null ? (
          // ── Search results, grouped by ICD-10 block ──────────────────────
          results.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">
                {loading ? "Пребарување…" : `Нема резултати за „${query}“.`}
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              {groupedResults.map(({ group, entries }) => (
                <section
                  key={group}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
                >
                  <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white">
                    {group}
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {entries.map((e) => (
                      <CodeRow key={e.code} entry={e} />
                    ))}
                  </ul>
                </section>
              ))}
              {results.length >= SEARCH_LIMIT && (
                <p className="text-center text-xs text-slate-400">
                  Прикажани се првите {SEARCH_LIMIT} резултати — прецизирајте го пребарувањето.
                </p>
              )}
            </div>
          )
        ) : (
          // ── Chapter accordion (browse mode) ───────────────────────────────
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
            className="space-y-3"
          >
            {chapters.map((ch) => {
              const open = openChapter === ch.number;
              const codes = chapterCodes[ch.number];
              return (
                <motion.section
                  key={ch.number}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                  }}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
                >
                  <button
                    type="button"
                    onClick={() => toggleChapter(ch.number)}
                    className="flex w-full items-center gap-3 bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-3 text-left text-sm font-bold text-white"
                  >
                    <span className="w-10 shrink-0 text-center font-mono">{ROMAN[ch.number - 1] ?? ch.number}</span>
                    <span className="flex-1 uppercase tracking-wide">{ch.title}</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                      {ch.codeCount}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
                  </button>
                  {open && (
                    !codes ? (
                      <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Вчитување…
                      </div>
                    ) : (
                      <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
                        {codes.map((e) => (
                          <CodeRow key={e.code} entry={e} />
                        ))}
                      </ul>
                    )
                  )}
                </motion.section>
              );
            })}
          </motion.div>
        )}
      </div>
    </>
  );
}
