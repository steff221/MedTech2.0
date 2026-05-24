"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "./BarChart";
import { KpiCounter } from "./KpiCounter";
import { MacedoniaMapMesh } from "./MacedoniaMapMesh";
import { hospitalService } from "@/services/hospital.service";
import { statsService } from "@/services/stats.service";

export function LandingPage() {
  const stats = useQuery({
    queryKey: ["stats", "overview"],
    queryFn: () => statsService.overview(),
    refetchInterval: 30_000, // gentle live-data feel
  });

  const hospitals = useQuery({
    queryKey: ["hospitals", "active"],
    queryFn: () => hospitalService.listActive(),
  });

  const nodes = (hospitals.data ?? [])
    .filter((h) => h.latitude != null && h.longitude != null)
    .map((h) => ({
      id: h.id,
      name: h.name,
      lat: Number(h.latitude),
      lon: Number(h.longitude),
      weight: 1,
    }));

  const today = stats.data?.date ? parseISO(stats.data.date) : new Date();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1117] text-white">
      {/* Background ambience */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
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

      <div className="relative mx-auto max-w-7xl px-6 pt-6">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/Logo-removebg-preview.png" alt="MedTech" width={40} height={40} />
            <span className="text-base font-bold tracking-tight">MedTech</span>
            <span className="ml-2 text-xs text-white/40">
              Македонија
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
            >
              Најави се
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400"
            >
              Регистрирај се
            </Link>
          </div>
        </header>

        {/* Hero */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT: Live Data panel */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-4"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <h2 className="text-sm font-semibold text-emerald-300">
                Во живо
              </h2>
            </div>
            <p className="mt-3 font-mono text-xs uppercase tracking-wider text-white/40">
              {format(today, "EEEE · dd MMM yyyy")}
            </p>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight">
              Национално здравство,{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                во реално време.
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
              Следи ги операциите на секоја поврзана болница во Македонија.
              Податоците се освежуваат на секои 30 секунди.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <KpiCounter
                label="Рецепти денес"
                value={stats.data?.prescriptionsToday ?? 0}
                sub="Издадени во последните 24ч"
              />
              <KpiCounter
                label="Упати денес"
                value={stats.data?.referralsToday ?? 0}
                sub="Нови закажувања"
              />
              <KpiCounter
                label="Активни пациенти"
                value={stats.data?.activePatients ?? 0}
                sub="Во мрежата"
              />
              <KpiCounter
                label="Активни лекари"
                value={stats.data?.activeDoctors ?? 0}
                sub="На дежурство"
              />
            </div>

          </motion.div>

          {/* RIGHT: Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="relative lg:col-span-8"
          >
            <div className="relative h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/10">
              <div
                aria-hidden
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />
              <MacedoniaMapMesh nodes={nodes} />

              {/* HUD chip */}
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-white/80">
                  {nodes.length} болници онлајн
                </span>
              </div>
              <div className="absolute bottom-5 right-5 text-right">
                <p className="font-mono text-[10px] text-white/30">
                  Северна Македонија
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom split: two bar charts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
          className="my-10 grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          <BarChart
            title="Прегледи по болница"
            subtitle="Последните 30 дена"
            orientation="horizontal"
            gradient={["#10b981", "#2dd4bf"]}
            data={(stats.data?.appointmentsByHospital ?? []).map((h) => ({
              label: h.hospital,
              sub: h.city,
              value: h.count,
            }))}
          />
          <BarChart
            title="Издадени рецепти"
            subtitle="Последните 7 дена"
            orientation="vertical"
            gradient={["#34d399", "#22d3ee"]}
            data={(stats.data?.prescriptionsByDay ?? []).map((d) => ({
              label: format(parseISO(d.day), "EEE"),
              sub: format(parseISO(d.day), "MMM d"),
              value: d.count,
            }))}
          />
        </motion.div>

        <footer className="mb-8 mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-5 text-xs text-white/30">
          <span>© MedTech 2026</span>
          <span>Сите права задржани</span>
        </footer>
      </div>
    </div>
  );
}
