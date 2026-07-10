// Страница за неочекувана грешка (route-level error boundary).
"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useT } from "@/hooks/useT";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d1117] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(244,63,94,0.16), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(16,185,129,0.14), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(244,63,94,0.5), rgba(251,113,133,0.7), rgba(244,63,94,0.5), transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 px-6 text-center"
      >
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500 shadow-2xl shadow-rose-500/30">
          <AlertTriangle className="h-8 w-8 text-white" />
        </div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl font-bold tracking-tight"
        >
          {t.common.errorTitle}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-4 max-w-sm text-sm text-white/50"
        >
          {t.common.errorDesc}
        </motion.p>

        {error.digest && (
          <p className="mt-3 font-mono text-xs text-white/30">#{error.digest}</p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400"
          >
            <RotateCcw className="h-4 w-4" /> {t.common.retry}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white/70 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
          >
            <Home className="h-4 w-4" /> {t.common.homeBtn}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
