// React компонента: копче (button) за повеќекратна употреба.
"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brand-500 to-brand-600 text-white " +
    "shadow-[0_1px_3px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.15)] " +
    "hover:from-brand-400 hover:to-brand-500 hover:shadow-glow-brand-sm " +
    "active:from-brand-600 active:to-brand-700 " +
    "border border-brand-600/30",
  secondary:
    "bg-white text-slate-700 border border-slate-200 " +
    "shadow-[0_1px_3px_rgba(15,23,42,0.06)] " +
    "hover:bg-slate-50 hover:border-slate-300 hover:shadow-[0_2px_6px_rgba(15,23,42,0.08)]",
  danger:
    "bg-gradient-to-b from-rose-500 to-rose-600 text-white " +
    "shadow-[0_1px_3px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.15)] " +
    "hover:from-rose-400 hover:to-rose-500 " +
    "border border-rose-600/30",
  ghost:
    "bg-transparent text-slate-700 " +
    "hover:bg-slate-100 hover:text-slate-900",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs font-medium gap-1.5 rounded-lg",
  md: "px-4 py-2 text-sm font-medium gap-2 rounded-lg",
  lg: "px-6 py-2.5 text-sm font-semibold gap-2 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, fullWidth, disabled, className, children, ...props },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      whileHover={!isDisabled ? { y: -1, scale: 1.01 } : undefined}
      whileTap={!isDisabled   ? { y: 0,  scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={isDisabled}
      className={cn(
        "relative inline-flex items-center justify-center",
        "font-medium transition-all duration-150",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin opacity-70" />
          <span className="opacity-70">{children}</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
});
