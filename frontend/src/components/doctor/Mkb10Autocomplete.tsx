"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { icd10Service } from "@/services/icd10.service";
import type { Icd10CodeResponse } from "@/types/api";

interface Mkb10AutocompleteProps {
  value: { code: string; label: string } | null;
  onChange: (v: { code: string; label: string } | null) => void;
  label?: string;
}

const DEBOUNCE_MS = 250;

export function Mkb10Autocomplete({ value, onChange, label = "Diagnosis (MKB10)" }: Mkb10AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Icd10CodeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced server search over the full WHO ICD-10 2019 catalog.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      icd10Service
        .search(query, 10)
        .then((r) => {
          if (!cancelled) setResults(r);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, query ? DEBOUNCE_MS : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={open ? query : (value ? `${value.code} — ${value.label}` : query)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          placeholder="Search code or condition…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        {loading && open && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
          >
            {results.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-500">{loading ? "Searching…" : "No matches."}</p>
            ) : (
              <ul>
                {results.map((r) => {
                  const selected = value?.code === r.code;
                  return (
                    <li key={r.code}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange({ code: r.code, label: r.title });
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-brand-50",
                          selected && "bg-brand-50",
                        )}
                      >
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
                          {selected && <Check className="h-4 w-4 text-brand-600" />}
                        </span>
                        <span className="font-mono text-xs font-semibold text-brand-700">{r.code}</span>
                        <span className="flex-1 text-slate-700">{r.title}</span>
                        <span className="max-w-[30%] truncate text-[10px] text-slate-400">{r.groupTitle}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {value && !open && (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
          className="mt-1 text-xs font-medium text-slate-500 hover:text-rose-600"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
