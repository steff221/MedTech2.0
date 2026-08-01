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
      {/* ── Hero gradient strip ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(110deg, #047857 0%, #059669 35%, #10b981 65%, #14b8a6 100%)",
        }}
      >
        {/* Ambient mesh overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%), " +
              "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)",
          }}
        />

        {/* Subtle grid pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), " +
              "linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hospital pill */}
            <span className="hidden shrink-0 items-center rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/20 sm:inline-flex">
              {hospital}
            </span>

            {/* Divider */}
            <span className="hidden text-white/30 sm:block" aria-hidden>·</span>

            {/* Page title */}
            <motion.h1
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="truncate text-lg font-bold tracking-tight text-white sm:text-xl"
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
