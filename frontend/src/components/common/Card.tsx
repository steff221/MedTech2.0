// React компонента: картичка (card) — контејнер за содржина.
"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";

interface CardProps extends HTMLMotionProps<"div"> {
  hover?:  boolean;
  padded?: boolean;
  variant?: "default" | "glass" | "elevated";
  /**
   * Edge marker, like the tabbed divider on a paper file. `drape` for routine
   * records, `carmine` for anything the clinician must act on, `brass` for
   * annotations. Omit it for ordinary containers — the rail should mean
   * something, so it is opt-in rather than decoration on every card.
   */
  rail?: "drape" | "carmine" | "brass";
}

const variantBase: Record<NonNullable<CardProps["variant"]>, string> = {
  default:  "border border-slate-200 bg-white shadow-card",
  // No longer frosted: an opaque panel with a hairline. Kept as a variant name
  // because call sites across the app still ask for it.
  glass:    "border border-slate-200 bg-white/95 shadow-card",
  elevated: "border border-slate-200 bg-white shadow-card-md",
};

export function Card({
  hover   = false,
  padded  = true,
  variant = "default",
  rail,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      // Was a 4px lift with a large soft shadow. A record card should sit flat
      // on the page; the hover state now reads as ink darkening at the border
      // rather than the card floating.
      whileHover={
        hover
          ? {
              borderColor: "#8a9899",
              boxShadow: "0 2px 4px rgba(16,38,43,0.08), 0 6px 16px rgba(16,38,43,0.06)",
            }
          : undefined
      }
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-md transition-colors duration-150",
        variantBase[variant],
        padded && "p-5",
        rail && "rail",
        rail === "carmine" && "rail-carmine",
        rail === "brass"   && "rail-brass",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
