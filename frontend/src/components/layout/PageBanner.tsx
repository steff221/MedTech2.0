// React компонента: банер/наслов на врвот на страницата.
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useDoctorProfile } from "@/hooks/useDoctor";

interface PageBannerProps {
  title:        string;
  breadcrumb?:  Array<{ label: string; href?: string }>;
  actions?:     React.ReactNode;
}

export function PageBanner({ title, breadcrumb, actions }: PageBannerProps) {
  const { data: doctor } = useDoctorProfile();
  const hospital = doctor?.hospitalName ?? "MedTech";

  return (
    <>
      {/* ── Header bar ────────────────────────────────────────────────────── */}
      {/* Was a four-stop emerald gradient with an ambient mesh and a grid
          overlay. Now one flat block of drape ink with a carmine rule along the
          bottom — the header of an official form rather than a marketing hero.
          The colour is hardcoded here rather than tokenised because it must
          match --drape exactly across every portal. */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden bg-teal-700"
      >
        {/* Carmine rule: the inked edge of a stamped document. */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-600" />

        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Institution — squared off, mono, like a facility code. */}
            <span className="hidden shrink-0 items-center rounded-sm bg-white/10 px-2 py-0.5 font-mono text-[0.6875rem] uppercase tracking-wider text-white/85 ring-1 ring-white/15 sm:inline-flex">
              {hospital}
            </span>

            {/* Divider */}
            <span className="hidden text-white/25 sm:block" aria-hidden>·</span>

            {/* Page title */}
            <motion.h1
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08, duration: 0.3 }}
              className="truncate font-display text-lg font-semibold tracking-tight text-white sm:text-xl"
            >
              {title}
            </motion.h1>
          </div>

          {actions && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              className="flex items-center gap-2"
            >
              {actions}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Breadcrumb bar ────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-2 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl items-center gap-1">
          <Link
            href="/doctor"
            className="inline-flex items-center gap-1 transition-colors hover:text-slate-900"
          >
            <Home className="h-3 w-3" />
            <span className="hidden sm:inline">Почетна</span>
          </Link>
          {breadcrumb?.map((b) => (
            <span key={b.label} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-slate-300" />
              {b.href ? (
                <Link href={b.href} className="transition-colors hover:text-slate-900">
                  {b.label}
                </Link>
              ) : (
                <span className="font-medium text-slate-700">{b.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
