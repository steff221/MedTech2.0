"use client";

import { motion } from "framer-motion";

/**
 * Next.js App Router `template.tsx` is re-mounted on every navigation,
 * which is exactly what we want for page-level enter/exit animations.
 * `layout.tsx` would persist across routes and not retrigger.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
