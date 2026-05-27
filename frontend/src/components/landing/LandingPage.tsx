"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bell,
  Calendar,
  ChevronRight,
  ClipboardList,
  FileText,
  Heart,
  Hospital,
  Lock,
  Shield,
  Stethoscope,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { BarChart } from "./BarChart";
import { KpiCounter } from "./KpiCounter";
import { MacedoniaMapMesh } from "./MacedoniaMapMesh";
import { hospitalService } from "@/services/hospital.service";
import { statsService } from "@/services/stats.service";

// ── Shared fade-up variant ────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay },
});

// ── Feature card data ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Calendar,
    title: "Закажување термини",
    desc: "Пациентите закажуваат онлајн; лекарите го гледаат полниот распоред со live waiting room.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: FileText,
    title: "Дигитален медицински досие",
    desc: "Целосна историја на записи, дијагнози, витали и MKB-10 кодови со непроменлив ревизорски лог.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    icon: ClipboardList,
    title: "Рецепти и упати",
    desc: "Издавање рецепти со проверка за интеракции, печатење и дигитални упати во секунди.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Video,
    title: "Виртуелни консултации",
    desc: "Виртуелни термини со автоматски генерирани Jitsi video соби — без посебен софтвер.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Bell,
    title: "Real-time известувања",
    desc: "SSE push известувања за пациенти и лекари — потврди, откази и потсетници моментално.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: Shield,
    title: "Безбедност и приватност",
    desc: "JWT автентикација, rate limiting, httpOnly cookies, ревизорски логови и шифрирање на сензитивни податоци.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
];

// ── Role cards ────────────────────────────────────────────────────────────────
const ROLES = [
  {
    icon: Stethoscope,
    role: "Лекари",
    color: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    items: ["Дневен распоред и waiting room", "Медицински записи и рецепти", "Упати и операции", "Работно расписание", "Индивидуални извештаи"],
  },
  {
    icon: Heart,
    role: "Пациенти",
    color: "from-rose-500/20 to-pink-500/10",
    border: "border-rose-500/20",
    iconColor: "text-rose-400",
    items: ["Закажување термини онлајн", "Преглед на здравствен досие", "Активни рецепти и упати", "Оценување на лекари", "Push известувања"],
  },
  {
    icon: Activity,
    role: "Администратори",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
    items: ["Управување со корисници", "Live статистики и графици", "Ревизорски логови", "Аномалии и безбедност", "Болници и лекари"],
  },
  {
    icon: Users,
    role: "Медицински сестри",
    color: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
    items: ["Пребарување на пациенти", "Денешни термини", "Внесување витали", "Преглед на лекари", "Листи за печатење"],
  },
];

// ── Trust stats ───────────────────────────────────────────────────────────────
const TRUST = [
  { value: "100%", label: "Дигитализиран процес" },
  { value: "< 1s", label: "Одговор на API" },
  { value: "4", label: "Типа корисници" },
  { value: "24/7", label: "Достапност" },
];

export function LandingPage() {
  const stats = useQuery({
    queryKey: ["stats", "overview"],
    queryFn: () => statsService.overview(),
    refetchInterval: 30_000,
  });

  const hospitals = useQuery({
    queryKey: ["hospitals", "active"],
    queryFn: () => hospitalService.listActive(),
  });

  const nodes = (hospitals.data ?? [])
    .filter((h) => h.latitude != null && h.longitude != null)
    .map((h) => ({ id: h.id, name: h.name, lat: Number(h.latitude), lon: Number(h.longitude), weight: 1 }));

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

      <div className="relative mx-auto max-w-7xl px-6">

        {/* ── Navbar ──────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            <Image src="/Logo-removebg-preview.png" alt="MedTech" width={38} height={38} />
            <span className="text-base font-bold tracking-tight">MedTech</span>
            <span className="ml-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              Македонија
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-white/60 sm:flex">
            <a href="#features" className="transition-colors hover:text-white">Функции</a>
            <a href="#portals" className="transition-colors hover:text-white">Портали</a>
            <a href="#live" className="transition-colors hover:text-white">Во живо</a>
          </nav>
        </header>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="mt-20 text-center">
          <motion.div {...fadeUp(0)}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-semibold text-emerald-300">
                Во живо · {format(today, "dd MMM yyyy")}
              </span>
            </div>
          </motion.div>

          <motion.h1
            {...fadeUp(0.08)}
            className="mx-auto mt-4 max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
          >
            Национално здравство{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              во реално време
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.16)}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60"
          >
            Платформа за дигитализирано здравство во Македонија. Закажување термини,
            медицински досиеа, рецепти, операции и live статистики — на едно место.
          </motion.p>

          <motion.div {...fadeUp(0.22)} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-emerald-500/30 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/40"
            >
              Започни бесплатно
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-white/80 transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
            >
              <Lock className="h-3.5 w-3.5" /> Најави се
            </Link>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            {...fadeUp(0.3)}
            className="mt-14 flex flex-wrap items-center justify-center gap-8 border-y border-white/5 py-6"
          >
            {TRUST.map((t) => (
              <div key={t.label} className="text-center">
                <p className="text-2xl font-bold text-white">{t.value}</p>
                <p className="mt-0.5 text-xs text-white/40">{t.label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── Live KPIs ───────────────────────────────────────────────────── */}
        <section id="live" className="mt-20">
          <motion.div {...fadeUp(0)} className="mb-8 text-center">
            <h2 className="text-2xl font-bold">Денешни статистики</h2>
            <p className="mt-2 text-sm text-white/40">Освежува на секои 30 секунди</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Рецепти денес", value: stats.data?.prescriptionsToday ?? 0, sub: "Издадени во 24ч" },
              { label: "Упати денес", value: stats.data?.referralsToday ?? 0, sub: "Нови закажувања" },
              { label: "Активни пациенти", value: stats.data?.activePatients ?? 0, sub: "Во мрежата" },
              { label: "Активни лекари", value: stats.data?.activeDoctors ?? 0, sub: "На дежурство" },
            ].map((k, i) => (
              <motion.div key={k.label} {...fadeUp(i * 0.06)}>
                <KpiCounter label={k.label} value={k.value} sub={k.sub} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Map + Charts ─────────────────────────────────────────────────── */}
        <section className="mt-10">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Map */}
            <motion.div {...fadeUp(0)} className="lg:col-span-7">
              <div className="relative h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/10">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <MacedoniaMapMesh nodes={nodes} />
                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium text-white/80">{nodes.length} болници онлајн</span>
                </div>
                <div className="absolute bottom-5 right-5 text-right">
                  <p className="font-mono text-[10px] text-white/30">Северна Македонија</p>
                </div>
              </div>
            </motion.div>

            {/* Charts stacked */}
            <div className="flex flex-col gap-5 lg:col-span-5">
              <motion.div {...fadeUp(0.1)}>
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
              </motion.div>
              <motion.div {...fadeUp(0.18)}>
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
            </div>
          </div>
        </section>

        {/* ── Features grid ────────────────────────────────────────────────── */}
        <section id="features" className="mt-28">
          <motion.div {...fadeUp(0)} className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Функционалности</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Сè на едно место</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/50">
              Дизајнирано за секој дел на здравствениот систем — од прием до извештај.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp(i * 0.06)}
                className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className={`mb-4 inline-flex items-center justify-center rounded-xl ${f.bg} p-3`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white">{f.title}</h3>
                <p className="text-xs leading-relaxed text-white/50">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Role portals ─────────────────────────────────────────────────── */}
        <section id="portals" className="mt-28">
          <motion.div {...fadeUp(0)} className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">Портали</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Прилагоден за секоја улога</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/50">
              Секој корисник го гледа токму она што му е потребно.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r, i) => (
              <motion.div
                key={r.role}
                {...fadeUp(i * 0.07)}
                className={`rounded-2xl border ${r.border} bg-gradient-to-br ${r.color} p-6`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <r.icon className={`h-6 w-6 ${r.iconColor}`} />
                  <h3 className="font-semibold text-white">{r.role}</h3>
                </div>
                <ul className="space-y-2">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-white/60">
                      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${r.iconColor} opacity-70`} style={{ background: "currentColor" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <motion.section
          {...fadeUp(0)}
          className="mt-28 overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-12 text-center"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
          <Hospital className="mx-auto mb-6 h-10 w-10 text-emerald-400 opacity-80" />
          <h2 className="text-3xl font-bold sm:text-4xl">Подготвен да започнеш?</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/60">
            Регистрирај се за неколку секунди. Нема кредитна картичка, нема скриени такси.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-emerald-500/30 transition-all hover:bg-emerald-400"
            >
              Креирај бесплатна сметка
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-white/80 transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
            >
              Веќе имам сметка
            </Link>
          </div>
        </motion.section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="mb-10 mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-white/30">
          <div className="flex items-center gap-2">
            <Image src="/Logo-removebg-preview.png" alt="MedTech" width={22} height={22} className="opacity-50" />
            <span>MedTech 2026 · Македонија</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="transition-colors hover:text-white/60">Функции</a>
            <a href="#portals" className="transition-colors hover:text-white/60">Портали</a>
            <Link href="/login" className="transition-colors hover:text-white/60">Најава</Link>
            <Link href="/register" className="transition-colors hover:text-white/60">Регистрација</Link>
          </div>
          <span>Сите права задржани</span>
        </footer>

      </div>
    </div>
  );
}
