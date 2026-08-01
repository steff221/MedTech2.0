// React компонента: значка (badge) за статус/ознака.
"use client";

import { cn } from "@/utils/cn";
import type { AppointmentStatus } from "@/types/api";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  tone?:      Tone;
  children:   React.ReactNode;
  className?: string;
  /** Inverts the chip for use on the drape-ink header bar. */
  onInk?:     boolean;
}

// Tone maps to a rule colour, not to a fill. See `.chip` in globals.css: the
// state lives in the inked leading edge, so five statuses can sit in one column
// without five coloured lozenges fighting the record text beside them.
const toneClass: Record<Tone, string> = {
  neutral: "chip-mute",
  success: "chip-ok",
  warning: "chip-wait",
  danger:  "chip-alert",
  info:    "chip-info",
};

export function Badge({ tone = "neutral", children, className, onInk }: BadgeProps) {
  return (
    // No entry animation. A status is present or it is not; fading it in on
    // every render was motion that carried no information.
    <span className={cn("chip", toneClass[tone], onInk && "chip-onink", className)}>
      {children}
    </span>
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
