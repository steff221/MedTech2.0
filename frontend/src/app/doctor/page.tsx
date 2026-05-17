"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  ClipboardList,
  ExternalLink,
  FileText,
  Globe,
  HeartPulse,
  Notebook,
  ShieldPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PageBanner } from "@/components/layout/PageBanner";
import { useDoctorProfile } from "@/hooks/useDoctor";

interface Tile {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  description?: string;
}

const PRIMARY: Tile[] = [
  {
    label: "Издадени упати",
    href: "/doctor/referrals",
    icon: ClipboardList,
    accent: "from-cyan-500 to-cyan-600",
    description: "Историја и нови упати",
  },
  {
    label: "Календар",
    href: "/doctor/schedule",
    icon: Calendar,
    accent: "from-emerald-500 to-teal-600",
    description: "Неделен распоред",
  },
  {
    label: "Прием на пациенти",
    href: "/doctor/patients",
    icon: Users,
    accent: "from-violet-500 to-violet-600",
    description: "Активни пациенти",
  },
  {
    label: "Документи",
    href: "/doctor/medical-journal",
    icon: FileText,
    accent: "from-amber-500 to-orange-600",
    description: "Медицински дневник",
  },
];

const SECONDARY: Tile[] = [
  {
    label: "Јавен портал",
    href: "/doctors",
    icon: Globe,
    accent: "from-slate-500 to-slate-700",
  },
  {
    label: "Е-здравство",
    href: "/doctor/mkb10",
    icon: ShieldPlus,
    accent: "from-emerald-600 to-emerald-700",
  },
];

export default function DoctorHomePage() {
  const { data: doctor } = useDoctorProfile();

  return (
    <>
      <PageBanner title="Почетна" />

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
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Добредојде
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
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {PRIMARY.map((tile) => (
            <TileLink key={tile.label} tile={tile} large />
          ))}
        </motion.div>

        {/* Secondary tiles */}
        <div className="mt-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Поврзани сервиси
          </p>
          <motion.div
            variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {SECONDARY.map((tile) => (
              <TileLink key={tile.label} tile={tile} />
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
}

function TileLink({ tile, large }: { tile: Tile; large?: boolean }) {
  const item = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div variants={item}>
      <Link href={tile.href}>
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-cardHover ${
            large ? "p-6" : "p-4"
          }`}
        >
          <div
            className={`mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${tile.accent} text-white shadow-lg shadow-slate-900/5 ${
              large ? "h-12 w-12" : "h-9 w-9"
            }`}
          >
            <tile.icon className={large ? "h-6 w-6" : "h-4 w-4"} />
          </div>
          <p
            className={`font-semibold text-slate-900 ${
              large ? "text-base" : "text-sm"
            }`}
          >
            {tile.label}
          </p>
          {tile.description && (
            <p className="mt-0.5 text-xs text-slate-500">{tile.description}</p>
          )}
          <ExternalLink className="absolute right-4 top-4 h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-emerald-500" />
        </motion.div>
      </Link>
    </motion.div>
  );
}
