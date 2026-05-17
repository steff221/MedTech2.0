"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-50 via-white to-slate-100">
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-200 opacity-30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 -left-32 h-80 w-80 rounded-full bg-brand-300 opacity-20 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white"
          >
            <Activity className="h-5 w-5" />
          </motion.div>
          <span className="text-xl font-semibold text-slate-900">MedTech</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
