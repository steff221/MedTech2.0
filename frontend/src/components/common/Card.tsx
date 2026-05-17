"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";

interface CardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
  padded?: boolean;
}

export function Card({
  hover = false,
  padded = true,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -3, boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)" } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-card",
        padded && "p-5",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
