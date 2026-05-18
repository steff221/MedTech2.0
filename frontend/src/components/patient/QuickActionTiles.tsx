"use client";

import { motion } from "framer-motion";
import { Calendar, FileText, Pill, Stethoscope, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Tile {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href: string;
  accent: string;
  glow: string;
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
  const tiles: Tile[] = [
    {
      label: "My appointments",
      value: upcomingCount,
      icon: Calendar,
      href: "/appointments",
      accent: "from-cyan-500 to-teal-600",
      glow: "rgba(6,182,212,0.25)",
    },
    {
      label: "Health records",
      value: "View",
      icon: FileText,
      href: "/health-records",
      accent: "from-emerald-500 to-emerald-600",
      glow: "rgba(16,185,129,0.25)",
    },
    {
      label: "Prescriptions",
      value: "View",
      icon: Pill,
      href: "/prescriptions",
      accent: "from-violet-500 to-violet-600",
      glow: "rgba(124,58,237,0.25)",
    },
    {
      label: "Find a doctor",
      value: "Search",
      icon: Stethoscope,
      href: "/doctors",
      accent: "from-amber-500 to-orange-600",
      glow: "rgba(251,146,60,0.25)",
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
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
              whileHover="hover"
              whileTap={{ scale: 0.97 }}
              variants={{
                hover: { y: -6, scale: 1.02 },
              }}
              transition={{ type: "spring", stiffness: 360, damping: 24 }}
              className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover"
            >
              {/* Soft accent glow on hover */}
              <motion.div
                aria-hidden
                variants={{ hover: { opacity: 1 } }}
                initial={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute -inset-px rounded-2xl"
                style={{
                  background: `radial-gradient(120% 60% at 50% 0%, ${tile.glow}, transparent 60%)`,
                }}
              />
              <motion.div
                variants={{ hover: { rotate: [0, -8, 8, 0], scale: 1.08 } }}
                transition={{ duration: 0.6 }}
                className={`relative mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tile.accent} text-white shadow-lg shadow-slate-900/5`}
              >
                <tile.icon className="h-5 w-5" />
              </motion.div>
              <p className="relative text-sm font-medium text-slate-500">{tile.label}</p>
              <p className="relative mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {typeof tile.value === "number" ? <CountUp to={tile.value} /> : tile.value}
              </p>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
