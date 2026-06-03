"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import type { AppointmentStatus } from "@/types/api";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  tone?:      Tone;
  dot?:       boolean;
  children:   React.ReactNode;
  className?: string;
}

const toneStyles: Record<Tone, { bg: string; text: string; dot: string; ring: string }> = {
  neutral: {
    bg:   "bg-slate-100",
    text: "text-slate-600",
    dot:  "bg-slate-400",
    ring: "ring-slate-200/60",
  },
  success: {
    bg:   "bg-emerald-50",
    text: "text-emerald-700",
    dot:  "bg-emerald-500",
    ring: "ring-emerald-200/60",
  },
  warning: {
    bg:   "bg-amber-50",
    text: "text-amber-700",
    dot:  "bg-amber-400",
    ring: "ring-amber-200/60",
  },
  danger: {
    bg:   "bg-rose-50",
    text: "text-rose-600",
    dot:  "bg-rose-500",
    ring: "ring-rose-200/60",
  },
  info: {
    bg:   "bg-brand-50",
    text: "text-brand-700",
    dot:  "bg-brand-500",
    ring: "ring-brand-200/60",
  },
};

export function Badge({ tone = "neutral", dot = false, children, className }: BadgeProps) {
  const s = toneStyles[tone];
  return (
    <motion.span
      initial={{ scale: 0.82, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
        "text-xs font-semibold",
        "ring-1",
        s.bg, s.text, s.ring,
        className,
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", s.dot)}
          aria-hidden
        />
      )}
      {children}
    </motion.span>
  );
}

export function appointmentStatusTone(status: AppointmentStatus): Tone {
  switch (status) {
    case "SCHEDULED":   return "warning";
    case "COMPLETED":   return "success";
    case "RESCHEDULED": return "info";
    case "CANCELLED":
    case "NO_SHOW":     return "danger";
  }
}
