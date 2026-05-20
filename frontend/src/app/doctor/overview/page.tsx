"use client";

import { motion } from "framer-motion";
import { Activity, Calendar, ClipboardList, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { PageBanner } from "@/components/layout/PageBanner";
import { Skeleton } from "@/components/common/Skeleton";
import { statsService } from "@/services/stats.service";
import { BarChart } from "@/components/landing/BarChart";

export default function DoctorOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats", "overview"],
    queryFn: () => statsService.overview(),
    refetchInterval: 60_000,
  });

  const stats = [
    { label: "Рецепти денес",    value: data?.prescriptionsToday ?? 0, icon: ClipboardList, color: "bg-emerald-50 text-emerald-600" },
    { label: "Упати денес",      value: data?.referralsToday ?? 0,     icon: Activity,      color: "bg-sky-50 text-sky-600"         },
    { label: "Активни пациенти", value: data?.activePatients ?? 0,     icon: Users,         color: "bg-violet-50 text-violet-600"   },
    { label: "Активни лекари",   value: data?.activeDoctors ?? 0,      icon: Calendar,      color: "bg-amber-50 text-amber-600"     },
  ];

  return (
    <>
      <PageBanner title="Преглед" breadcrumb={[{ label: "Преглед" }]} />

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* KPI row */}
        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          animate="visible"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
            >
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold tabular-nums text-slate-900">{s.value.toLocaleString()}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-1 gap-5 lg:grid-cols-2"
          >
            <BarChart
              title="Закажувања по болница"
              subtitle="Последни 30 дена"
              orientation="horizontal"
              gradient={["#10b981", "#2dd4bf"]}
              data={(data?.appointmentsByHospital ?? []).map((h) => ({
                label: h.hospital,
                sub: h.city,
                value: h.count,
              }))}
            />
            <BarChart
              title="Издадени рецепти"
              subtitle="Последни 7 дена"
              orientation="vertical"
              gradient={["#34d399", "#22d3ee"]}
              data={(data?.prescriptionsByDay ?? []).map((d) => ({
                label: format(parseISO(d.day), "EEE"),
                sub: format(parseISO(d.day), "d MMM"),
                value: d.count,
              }))}
            />
          </motion.div>
        )}
      </div>
    </>
  );
}
