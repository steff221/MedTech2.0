"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1117] text-white">
      {/* Ambient gradients — matches the landing hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.22), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(20,184,166,0.18), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(16,185,129,0.6), rgba(45,212,191,0.8), rgba(16,185,129,0.6), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top brand bar */}
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 pt-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/Logo-removebg-preview.png"
            alt="MedTech"
            width={40}
            height={40}
          />
          <span className="text-base font-bold tracking-tight">MedTech</span>
          <span className="ml-2 text-xs text-white/40">Македонија</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-semibold text-white/70 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Назад
        </Link>
      </div>

      {/* Centered card */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-md flex-col justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(16,185,129,0.25)]"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
