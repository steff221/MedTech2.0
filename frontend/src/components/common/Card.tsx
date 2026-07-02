// React компонента: картичка (card) — контејнер за содржина.
"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";

interface CardProps extends HTMLMotionProps<"div"> {
  hover?:  boolean;
  padded?: boolean;
  variant?: "default" | "glass" | "elevated";
}

const variantBase: Record<NonNullable<CardProps["variant"]>, string> = {
  default:  "border border-slate-200/80 bg-white shadow-card",
  glass:    "border border-white/40 bg-white/70 backdrop-blur-md shadow-card",
  elevated: "border border-slate-200/60 bg-white shadow-card-md",
};

export function Card({
  hover   = false,
  padded  = true,
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow:
                "0 20px 40px -8px rgba(15,23,42,0.12), 0 8px 16px -4px rgba(15,23,42,0.06)",
            }
          : undefined
      }
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={cn(
        "rounded-2xl transition-shadow duration-200",
        variantBase[variant],
        padded && "p-5",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
