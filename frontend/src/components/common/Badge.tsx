"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import type { AppointmentStatus } from "@/types/api";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

const toneStyles: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  info: "bg-brand-100 text-brand-700",
};

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </motion.span>
  );
}

export function appointmentStatusTone(status: AppointmentStatus): Tone {
  switch (status) {
    case "SCHEDULED":
      return "warning";
    case "COMPLETED":
      return "success";
    case "RESCHEDULED":
      return "warning";
    case "CANCELLED":
    case "NO_SHOW":
      return "danger";
  }
}
