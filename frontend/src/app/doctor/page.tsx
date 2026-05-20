"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  ClipboardList,
  ExternalLink,
  FileText,
  Globe,
  HeartPulse,
  ShieldPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PageBanner } from "@/components/layout/PageBanner";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { useT } from "@/hooks/useT";

export default function DoctorHomePage() {
  const { data: doctor } = useDoctorProfile();
  const t = useT();

  const PRIMARY = [
    {
      label:    t.doctorHome.calendarLabel,
      href:     "/doctor/schedule",
      icon:     Calendar,
      iconBg:   "bg-emerald-500",
      description: t.doctorHome.calendarDesc,
      featured: true,
    },
    {
      label:    t.doctorHome.patientsLabel,
      href:     "/doctor/patients",
      icon:     Users,
      iconBg:   "bg-violet-500",
      description: t.doctorHome.patientsDesc,
    },
    {
      label:    t.doctorHome.referralsLabel,
      href:     "/doctor/referrals",
      icon:     ClipboardList,
      iconBg:   "bg-sky-500",
      description: t.doctorHome.referralsDesc,
    },
    {
      label:    t.doctorHome.documentsLabel,
      href:     "/doctor/medical-journal",
      icon:     FileText,
      iconBg:   "bg-amber-500",
      description: t.doctorHome.documentsDesc,
    },
  ];

  const SECONDARY = [
    { label: t.doctorHome.publicPortal, href: "/doctors",     icon: Globe,      iconBg: "bg-slate-400" },
    { label: t.doctorHome.eHealth,      href: "/doctor/mkb10", icon: ShieldPlus, iconBg: "bg-emerald-600" },
  ];

  return (
    <>
      <PageBanner title={t.doctorNav.home} />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Greeting */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              {t.doctorHome.welcomeLabel}
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              Dr. {doctor?.firstName ?? ""} {doctor?.lastName ?? ""}
            </h2>
            {doctor && (
              <p className="text-sm text-slate-500">
                {doctor.specialization}
                {doctor.hospitalName ? ` · ${doctor.hospitalName}` : ""}
              </p>
            )}
          </div>
        </motion.section>

        {/* Primary tiles */}
        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4 md:grid-cols-3"
        >
          {PRIMARY.map((tile) => (
            <TileLink key={tile.label} tile={tile} />
          ))}
        </motion.div>

        {/* Secondary tiles */}
        <div className="mt-10">
          <p className="mb-3 text-sm font-medium text-slate-400">
            {t.doctorHome.relatedServices}
          </p>
          <motion.div
            variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {SECONDARY.map((tile) => (
              <TileLink key={tile.label} tile={tile} small />
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
}

interface Tile {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  description?: string;
  featured?: boolean;
}

function TileLink({ tile, small }: { tile: Tile; small?: boolean }) {
  const item = {
    hidden:  { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div variants={item} className={tile.featured ? "md:col-span-2" : undefined}>
      <Link href={tile.href}>
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-cardHover ${
            small ? "p-4" : tile.featured ? "p-7" : "p-6"
          }`}
        >
          {/* Fixed icon sizes — h-13 is not a valid Tailwind class, use h-12/h-14 */}
          <div
            className={`mb-4 inline-flex items-center justify-center rounded-xl ${tile.iconBg} text-white ${
              tile.featured ? "h-14 w-14" : small ? "h-8 w-8" : "h-11 w-11"
            }`}
          >
            <tile.icon className={tile.featured ? "h-7 w-7" : small ? "h-4 w-4" : "h-5 w-5"} />
          </div>
          <p className={`font-semibold text-slate-900 ${tile.featured ? "text-lg" : small ? "text-sm" : "text-base"}`}>
            {tile.label}
          </p>
          {tile.description && (
            <p className="mt-0.5 text-sm text-slate-500">{tile.description}</p>
          )}
          <ExternalLink className="absolute right-4 top-4 h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-emerald-500" />
        </motion.div>
      </Link>
    </motion.div>
  );
}
