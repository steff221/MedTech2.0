"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useDoctorProfile } from "@/hooks/useDoctor";

interface PageBannerProps {
  title: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export function PageBanner({ title, breadcrumb, actions }: PageBannerProps) {
  const { data: doctor } = useDoctorProfile();
  const hospital = doctor?.hospitalName ?? "MedTech";

  return (
    <>
      {/* Cyan banner — mirrors the MojTermin "JZU ... - Page" hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <h1 className="text-lg font-bold text-white sm:text-xl">
            <span className="font-medium opacity-80">ЈЗУ {hospital}</span>
            <span className="mx-2 opacity-50">·</span>
            <span>{title}</span>
          </h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </motion.div>

      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white px-6 py-2 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl items-center gap-1">
          <Link href="/doctor" className="hover:text-slate-900">
            Почетна
          </Link>
          {breadcrumb?.map((b) => (
            <span key={b.label} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-slate-300" />
              {b.href ? (
                <Link href={b.href} className="hover:text-slate-900">
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
