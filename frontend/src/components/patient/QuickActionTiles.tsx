"use client";

import { motion } from "framer-motion";
import { Calendar, FileText, Pill, Stethoscope, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/hooks/useT";

interface Tile {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href: string;
  iconBg: string;
}

interface QuickActionTilesProps {
  upcomingCount: number;
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

function CountUp({ to, durationMs = 1200 }: { to: number; durationMs?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let start: number | null = null;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / durationMs);
      setDisplay(Math.round(to * ease(t)));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [to, durationMs]);

  return <>{display}</>;
}

export function QuickActionTiles({ upcomingCount }: QuickActionTilesProps) {
  const t = useT();

  const tiles: Tile[] = [
    {
      label: t.nav.appointments,
      value: upcomingCount,
      icon: Calendar,
      href: "/appointments",
      iconBg: "bg-sky-500",
    },
    {
      label: t.nav.healthRecords,
      value: t.common.view,
      icon: FileText,
      href: "/health-records",
      iconBg: "bg-emerald-500",
    },
    {
      label: t.nav.prescriptions,
      value: t.common.view,
      icon: Pill,
      href: "/prescriptions",
      iconBg: "bg-violet-500",
    },
    {
      label: t.nav.findDoctor,
      value: t.common.search,
      icon: Stethoscope,
      href: "/doctors",
      iconBg: "bg-amber-500",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
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
        <motion.div key={tile.href} variants={item}>
          <Link href={tile.href}>
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              className="group h-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-200"
            >
              <div
                className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl ${tile.iconBg} text-white`}
              >
                <tile.icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">{tile.label}</p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-slate-800">
                {typeof tile.value === "number" ? <CountUp to={tile.value} /> : tile.value}
              </p>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
