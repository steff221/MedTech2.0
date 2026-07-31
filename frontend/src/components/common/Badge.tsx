// React компонента: значка (badge) за статус/ознака.
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
  // Informational sits on drape, not brand. Carmine is now the institutional
  // mark, and a status chip must never be mistaken for it.
  info: {
    bg:   "bg-teal-50",
    text: "text-teal-700",
    dot:  "bg-teal-600",
    ring: "ring-teal-200/60",
  },
};

export function Badge({ tone = "neutral", dot = false, children, className }: BadgeProps) {
  const s = toneStyles[tone];
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        // Squared off and letterspaced: a field value on a form, not a pill.
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5",
        "text-[0.6875rem] font-semibold uppercase tracking-wider",
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
