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

// Flat ink blocks. The vertical gradients and glow were the most "template"
// thing in the old system; a control on a clinical form should look printed.
const variantStyles: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white border border-brand-700 " +
    "hover:bg-brand-700 active:bg-brand-800",
  secondary:
    "bg-white text-slate-700 border border-slate-300 " +
    "hover:bg-slate-50 hover:border-slate-400",
  // Destructive stays on rose, not carmine — carmine is now the institutional
  // brand mark, so it must not double as the "this deletes data" signal.
  danger:
    "bg-rose-600 text-white border border-rose-700 " +
    "hover:bg-rose-700 active:bg-rose-800",
  ghost:
    "bg-transparent text-slate-700 " +
    "hover:bg-slate-100 hover:text-slate-900",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs font-medium gap-1.5 rounded",
  md: "px-4 py-2 text-sm font-medium gap-2 rounded",
  lg: "px-6 py-2.5 text-sm font-semibold gap-2 rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, fullWidth, disabled, className, children, ...props },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      // No hover lift — only a press. Buttons that rise to meet the cursor read
      // as consumer-app playfulness; the tap feedback still confirms the click.
      whileTap={!isDisabled ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
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
