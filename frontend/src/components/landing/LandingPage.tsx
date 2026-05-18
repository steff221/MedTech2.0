"use client";

import { motion } from "framer-motion";
import { Activity, ArrowRight } from "lucide-react";
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
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.25), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(6,182,212,0.18), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(124,58,237,0.6), rgba(6,182,212,0.8), rgba(124,58,237,0.6), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pt-6">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">MedTech</span>
            <span className="ml-2 text-[10px] uppercase tracking-widest text-white/40">
              Healthcare · MK
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur transition-colors hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition-transform hover:scale-[1.03]"
            >
              Create account
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
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
                Live Data
              </h2>
            </div>
            <p className="mt-3 font-mono text-xs uppercase tracking-wider text-white/40">
              {format(today, "EEEE · dd MMM yyyy")}
            </p>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight">
              National healthcare,{" "}
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                in real time.
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
              Live operational signal from every connected hospital across North
              Macedonia. Updated every 30 seconds.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <KpiCounter
                label="Prescriptions today"
                value={stats.data?.prescriptionsToday ?? 0}
                sub="Issued in last 24h"
                accent="teal"
              />
              <KpiCounter
                label="Referrals today"
                value={stats.data?.referralsToday ?? 0}
                sub="New appointments"
                accent="violet"
              />
              <KpiCounter
                label="Active patients"
                value={stats.data?.activePatients ?? 0}
                sub="Across network"
                accent="teal"
              />
              <KpiCounter
                label="Active doctors"
                value={stats.data?.activeDoctors ?? 0}
                sub="On call & on duty"
                accent="violet"
              />
            </div>

            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition-transform hover:scale-[1.02]"
            >
              Enter the platform <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* RIGHT: Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="relative lg:col-span-8"
          >
            <div className="relative h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/10">
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
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
                  {nodes.length} hospitals online
                </span>
              </div>
              <div className="absolute bottom-5 right-5 text-right">
                <p className="text-[10px] uppercase tracking-widest text-white/30">
                  Network map
                </p>
                <p className="font-mono text-xs text-white/60">
                  REPUBLIC OF NORTH MACEDONIA
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
            title="Appointments by hospital"
            subtitle="Last 30 days"
            orientation="horizontal"
            gradient={["#7c3aed", "#06b6d4"]}
            data={(stats.data?.appointmentsByHospital ?? []).map((h) => ({
              label: h.hospital,
              sub: h.city,
              value: h.count,
            }))}
          />
          <BarChart
            title="Prescriptions issued"
            subtitle="Last 7 days"
            orientation="vertical"
            gradient={["#a855f7", "#22d3ee"]}
            data={(stats.data?.prescriptionsByDay ?? []).map((d) => ({
              label: format(parseISO(d.day), "EEE"),
              sub: format(parseISO(d.day), "MMM d"),
              value: d.count,
            }))}
          />
        </motion.div>

        <footer className="mb-8 mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-5 text-[10px] uppercase tracking-widest text-white/30">
          <span>© MedTech 2026</span>
          <span>v2.0 · Build {format(today, "yyyy.MM.dd")}</span>
        </footer>
      </div>
    </div>
  );
}
