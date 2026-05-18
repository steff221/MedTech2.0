"use client";

import { motion } from "framer-motion";
import { Calendar, FileText, Pill, Stethoscope, type LucideIcon } from "lucide-react";
import Link from "next/link";

interface Tile {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href: string;
  accent: string;
}

interface QuickActionTilesProps {
  upcomingCount: number;
}

export function QuickActionTiles({ upcomingCount }: QuickActionTilesProps) {
  const tiles: Tile[] = [
    {
      label: "My appointments",
      value: upcomingCount,
      icon: Calendar,
      href: "/appointments",
      accent: "from-brand-500 to-brand-600",
    },
    {
      label: "Health records",
      value: "View",
      icon: FileText,
      href: "/health-records",
      accent: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Prescriptions",
      value: "View",
      icon: Pill,
      href: "/prescriptions",
      accent: "from-violet-500 to-violet-600",
    },
    {
      label: "Find a doctor",
      value: "Search",
      icon: Stethoscope,
      href: "/doctors",
      accent: "from-amber-500 to-amber-600",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
    >
      {tiles.map((tile) => (
        <motion.div key={tile.label} variants={item}>
          <Link href={tile.href}>
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 24 }}
              className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover"
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tile.accent} text-white shadow-lg shadow-slate-900/5`}
              >
                <tile.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-500">{tile.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{tile.value}</p>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
