// React компонента: содржина на почетната (landing) страница.
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
  Moon,
  Shield,
  Stethoscope,
  Sun,
  Users,
  Video,
} from "lucide-react";
import { BarChart } from "./BarChart";
import { KpiCounter } from "./KpiCounter";
import { MacedoniaMapMesh } from "./MacedoniaMapMesh";
import { hospitalService } from "@/services/hospital.service";
import { statsService } from "@/services/stats.service";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay },
});

const FEATURES = [
  {
    icon: Calendar,
    title: "Закажување термини",
    desc: "Пациентите закажуваат онлајн; лекарите го гледаат полниот распоред со live waiting room.",
    light: { color: "text-emerald-600", bg: "bg-emerald-50" },
    dark:  { color: "text-emerald-400", bg: "bg-emerald-500/10" },
  },
  {
    icon: FileText,
    title: "Дигитален медицински досие",
    desc: "Целосна историја на записи, дијагнози, витали и MKB-10 кодови со непроменлив ревизорски лог.",
    light: { color: "text-teal-600", bg: "bg-teal-50" },
    dark:  { color: "text-teal-400", bg: "bg-teal-500/10" },
  },
  {
    icon: ClipboardList,
    title: "Рецепти и упати",
    desc: "Издавање рецепти со проверка за интеракции, печатење и дигитални упати во секунди.",
    light: { color: "text-cyan-600", bg: "bg-cyan-50" },
    dark:  { color: "text-cyan-400", bg: "bg-cyan-500/10" },
  },
  {
    icon: Video,
    title: "Виртуелни консултации",
    desc: "Виртуелни термини со автоматски генерирани Jitsi video соби — без посебен софтвер.",
    light: { color: "text-violet-600", bg: "bg-violet-50" },
    dark:  { color: "text-violet-400", bg: "bg-violet-500/10" },
  },
  {
    icon: Bell,
    title: "Real-time известувања",
    desc: "SSE push известувања за пациенти и лекари — потврди, откази и потсетници моментално.",
    light: { color: "text-rose-600", bg: "bg-rose-50" },
    dark:  { color: "text-rose-400", bg: "bg-rose-500/10" },
  },
  {
    icon: Shield,
    title: "Безбедност и приватност",
    desc: "JWT автентикација, rate limiting, httpOnly cookies, ревизорски логови и шифрирање на сензитивни податоци.",
    light: { color: "text-amber-600", bg: "bg-amber-50" },
    dark:  { color: "text-amber-400", bg: "bg-amber-500/10" },
  },
];

const ROLES = [
  {
    icon: Stethoscope,
    role: "Лекари",
    light: { card: "from-emerald-50 to-teal-50 border-emerald-200", icon: "text-emerald-600", dot: "bg-emerald-400" },
    dark:  { card: "from-emerald-500/20 to-teal-500/10 border-emerald-500/20", icon: "text-emerald-400", dot: "bg-emerald-400" },
    items: ["Дневен распоред и waiting room", "Медицински записи и рецепти", "Упати и операции", "Работно расписание", "Индивидуални извештаи"],
  },
  {
    icon: Heart,
    role: "Пациенти",
    light: { card: "from-rose-50 to-pink-50 border-rose-200", icon: "text-rose-600", dot: "bg-rose-400" },
    dark:  { card: "from-rose-500/20 to-pink-500/10 border-rose-500/20", icon: "text-rose-400", dot: "bg-rose-400" },
    items: ["Закажување термини онлајн", "Преглед на здравствен досие", "Активни рецепти и упати", "Оценување на лекари", "Push известувања"],
  },
  {
    icon: Activity,
    role: "Администратори",
    light: { card: "from-violet-50 to-purple-50 border-violet-200", icon: "text-violet-600", dot: "bg-violet-400" },
    dark:  { card: "from-violet-500/20 to-purple-500/10 border-violet-500/20", icon: "text-violet-400", dot: "bg-violet-400" },
    items: ["Управување со корисници", "Live статистики и графици", "Ревизорски логови", "Аномалии и безбедност", "Болници и лекари"],
  },
  {
    icon: Users,
    role: "Медицински сестри",
    light: { card: "from-cyan-50 to-blue-50 border-cyan-200", icon: "text-cyan-600", dot: "bg-cyan-400" },
    dark:  { card: "from-cyan-500/20 to-blue-500/10 border-cyan-500/20", icon: "text-cyan-400", dot: "bg-cyan-400" },
    items: ["Пребарување на пациенти", "Денешни термини", "Внесување витали", "Преглед на лекари", "Листи за печатење"],
  },
];

const TRUST = [
  { value: "100%", label: "Дигитализиран процес" },
  { value: "4",    label: "Типа корисници" },
  { value: "24/7", label: "Достапност" },
];

export function LandingPage() {
  const [isDark, setIsDark] = useState(false);

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

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const T = {
    page:        isDark ? "bg-[#0d1117] text-white"          : "bg-white text-gray-900",
    heading:     isDark ? "text-white"                        : "text-gray-900",
    muted:       isDark ? "text-white/60"                     : "text-gray-600",
    faint:       isDark ? "text-white/40"                     : "text-gray-400",
    navLink:     isDark ? "text-white/60 hover:text-white"    : "text-gray-500 hover:text-gray-900",
    badge:       isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-emerald-200 bg-emerald-50 text-emerald-700",
    liveBadge:   isDark ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700",
    liveText:    isDark ? "text-emerald-300"                  : "text-emerald-700",
    heroGrad:    isDark ? "from-emerald-300 via-teal-300 to-cyan-300" : "from-emerald-500 via-teal-500 to-cyan-500",
    trustBorder: isDark ? "border-white/5"                    : "border-gray-200",
    secLabel:    isDark ? "text-emerald-400"                  : "text-emerald-600",
    secSub:      isDark ? "text-white/50"                     : "text-gray-500",
    featureCard: isDark ? "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]" : "border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:shadow-md",
    mapCard:     isDark ? "border-white/10 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/10" : "border-gray-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50",
    mapDotColor: isDark ? "rgba(255,255,255,0.06)"            : "rgba(0,0,0,0.05)",
    mapBadge:    isDark ? "border-white/10 bg-black/40 text-white/80" : "border-gray-200 bg-white/90 text-gray-700",
    mapCredit:   isDark ? "text-white/30"                     : "text-gray-400",
    ctaCard:     isDark ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" : "border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-white",
    ctaDotColor: isDark ? "rgba(255,255,255,0.08)"            : "rgba(16,185,129,0.08)",
    btnSecNav:   isDark ? "border-white/15 bg-white/[0.04] text-white/80 hover:border-white/30 hover:bg-white/[0.08] hover:text-white" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900",
    btnSecCta:   isDark ? "border-white/15 bg-white/[0.04] text-white/80 hover:border-white/30 hover:bg-white/[0.08] hover:text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900",
    footerBorder:isDark ? "border-white/5"                    : "border-gray-200",
    footerText:  isDark ? "text-white/30"                     : "text-gray-400",
    footerLink:  isDark ? "hover:text-white/60"               : "hover:text-gray-600",
    toggleBg:    isDark ? "border-white/15 bg-white/[0.06] text-white/70 hover:bg-white/[0.12]" : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100",
    ambienceOp:  isDark ? "opacity-60"                        : "opacity-40",
    ambienceGrad:isDark
      ? "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.22), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(20,184,166,0.18), transparent 60%)"
      : "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.12), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(20,184,166,0.10), transparent 60%)",
    topLine: isDark
      ? "linear-gradient(90deg, transparent, rgba(16,185,129,0.6), rgba(45,212,191,0.8), rgba(16,185,129,0.6), transparent)"
      : "linear-gradient(90deg, transparent, rgba(16,185,129,0.4), rgba(45,212,191,0.5), rgba(16,185,129,0.4), transparent)",
  };

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${T.page}`}>
      {/* Background ambience */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${T.ambienceOp}`}
        style={{ background: T.ambienceGrad }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: T.topLine }}
      />

      <div className="relative mx-auto max-w-7xl px-6">

        {/* ── Navbar ──────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            <Image src="/Logo-removebg-preview.png" alt="MedTech" width={38} height={38} />
            <span className={`text-base font-bold tracking-tight ${T.heading}`}>MedTech</span>
            <span className={`ml-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${T.badge}`}>
              Македонија
            </span>
          </div>
          <nav className={`hidden items-center gap-6 text-sm sm:flex ${T.navLink.split(" hover:")[0]}`}>
            <a href="#features" className={`transition-colors ${T.navLink}`}>Функции</a>
            <a href="#portals" className={`transition-colors ${T.navLink}`}>Портали</a>
            <a href="#live" className={`transition-colors ${T.navLink}`}>Во живо</a>
          </nav>
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${T.toggleBg}`}
            aria-label="Toggle dark/light mode"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {isDark ? "Light" : "Dark"}
          </button>
        </header>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="mt-20 text-center">
          <motion.div {...fadeUp(0)}>
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 ${T.liveBadge}`}>
              <span className={`text-xs font-semibold ${T.liveText}`}>
                Во живо · {format(today, "dd MMM yyyy")}
              </span>
            </div>
          </motion.div>

          <motion.h1
            {...fadeUp(0.08)}
            className={`mx-auto mt-4 max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl ${T.heading}`}
          >
            Национално здравство{" "}
            <span className={`bg-gradient-to-r bg-clip-text text-transparent ${T.heroGrad}`}>
              во реално време
            </span>
          </motion.h1>

          <motion.p {...fadeUp(0.16)} className={`mx-auto mt-6 max-w-2xl text-lg leading-relaxed ${T.muted}`}>
            Платформа за дигитализирано здравство во Македонија. Закажување термини,
            медицински досиеа, рецепти, операции и live статистики — на едно место.
          </motion.p>

          <motion.div {...fadeUp(0.22)} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-push group flex items-center gap-2 px-8 py-3.5 text-sm shadow-xl"
            >
              Започни бесплатно
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/login" className={`flex items-center gap-2 rounded-full border px-8 py-3.5 text-sm font-semibold transition-all ${T.btnSecNav}`}>
              <Lock className="h-3.5 w-3.5" /> Најави се
            </Link>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            {...fadeUp(0.3)}
            className={`mt-14 flex flex-wrap items-center justify-center gap-8 border-y py-6 ${T.trustBorder}`}
          >
            {TRUST.map((t) => (
              <div key={t.label} className="text-center">
                <p className={`text-2xl font-bold ${T.heading}`}>{t.value}</p>
                <p className={`mt-0.5 text-xs ${T.faint}`}>{t.label}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── Live KPIs ───────────────────────────────────────────────────── */}
        <section id="live" className="mt-20">
          <motion.div {...fadeUp(0)} className="mb-8 text-center">
            <h2 className={`text-2xl font-bold ${T.heading}`}>Денешни статистики</h2>
            <p className={`mt-2 text-sm ${T.faint}`}>Освежува на секои 30 секунди</p>
          </motion.div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Рецепти денес",    value: stats.data?.prescriptionsToday ?? 0, sub: "Издадени во 24ч" },
              { label: "Упати денес",      value: stats.data?.referralsToday ?? 0,     sub: "Нови закажувања" },
              { label: "Активни пациенти", value: stats.data?.activePatients ?? 0,     sub: "Во мрежата" },
              { label: "Активни лекари",   value: stats.data?.activeDoctors ?? 0,      sub: "На дежурство" },
            ].map((k, i) => (
              <motion.div key={k.label} {...fadeUp(i * 0.06)}>
                <KpiCounter label={k.label} value={k.value} sub={k.sub} dark={isDark} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Map + Charts ─────────────────────────────────────────────────── */}
        <section className="mt-10">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Map */}
            <motion.div {...fadeUp(0)} className="lg:col-span-7">
              <div className={`relative h-[400px] overflow-hidden rounded-3xl border ${T.mapCard}`}>
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, ${T.mapDotColor} 1px, transparent 0)`,
                    backgroundSize: "24px 24px",
                  }}
                />
                <MacedoniaMapMesh nodes={nodes} dark={isDark} />
                <div className={`absolute left-5 top-5 flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur shadow-sm ${T.mapBadge}`}>
                  <span className="text-xs font-medium">{nodes.length} болници онлајн</span>
                </div>
                <div className="absolute bottom-5 right-5 text-right">
                  <p className={`font-mono text-[10px] ${T.mapCredit}`}>Северна Македонија</p>
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
                  dark={isDark}
                  data={(stats.data?.appointmentsByHospital ?? []).map((h) => ({ label: h.hospital, sub: h.city, value: h.count }))}
                />
              </motion.div>
              <motion.div {...fadeUp(0.18)}>
                <BarChart
                  title="Издадени рецепти"
                  subtitle="Последните 7 дена"
                  orientation="vertical"
                  gradient={["#34d399", "#22d3ee"]}
                  dark={isDark}
                  data={(stats.data?.prescriptionsByDay ?? []).map((d) => ({ label: format(parseISO(d.day), "EEE"), sub: format(parseISO(d.day), "MMM d"), value: d.count }))}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Features grid ────────────────────────────────────────────────── */}
        <section id="features" className="mt-28">
          <motion.div {...fadeUp(0)} className="mb-12 text-center">
            <p className={`mb-3 text-xs font-semibold uppercase tracking-widest ${T.secLabel}`}>Функционалности</p>
            <h2 className={`text-3xl font-bold sm:text-4xl ${T.heading}`}>Се на едно место</h2>
            <p className={`mx-auto mt-4 max-w-xl text-sm leading-relaxed ${T.secSub}`}>
              Дизајнирано за секој дел на здравствениот систем — од прием до извештај.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const fc = isDark ? f.dark : f.light;
              return (
                <motion.div
                  key={f.title}
                  {...fadeUp(i * 0.06)}
                  className={`group rounded-2xl border p-6 transition-all ${T.featureCard}`}
                >
                  <div className={`mb-4 inline-flex items-center justify-center rounded-xl p-3 ${fc.bg}`}>
                    <f.icon className={`h-5 w-5 ${fc.color}`} />
                  </div>
                  <h3 className={`mb-2 text-sm font-semibold ${T.heading}`}>{f.title}</h3>
                  <p className={`text-xs leading-relaxed ${T.secSub}`}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Role portals ─────────────────────────────────────────────────── */}
        <section id="portals" className="mt-28">
          <motion.div {...fadeUp(0)} className="mb-12 text-center">
            <p className={`mb-3 text-xs font-semibold uppercase tracking-widest ${T.secLabel}`}>Портали</p>
            <h2 className={`text-3xl font-bold sm:text-4xl ${T.heading}`}>Прилагоден за секоја улога</h2>
            <p className={`mx-auto mt-4 max-w-xl text-sm leading-relaxed ${T.secSub}`}>
              Секој корисник го гледа токму она што му е потребно.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r, i) => {
              const rc = isDark ? r.dark : r.light;
              return (
                <motion.div
                  key={r.role}
                  {...fadeUp(i * 0.07)}
                  className={`rounded-2xl border bg-gradient-to-br p-6 ${isDark ? "" : "shadow-sm"} ${rc.card}`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <r.icon className={`h-6 w-6 ${rc.icon}`} />
                    <h3 className={`font-semibold ${T.heading}`}>{r.role}</h3>
                  </div>
                  <ul className="space-y-2">
                    {r.items.map((item) => (
                      <li key={item} className={`marker flex items-start gap-2 text-xs ${T.muted}`}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <motion.section
          {...fadeUp(0)}
          className={`relative mt-28 overflow-hidden rounded-3xl border p-12 text-center ${isDark ? "" : "shadow-sm"} ${T.ctaCard}`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${T.ctaDotColor} 1px, transparent 0)`,
              backgroundSize: "20px 20px",
            }}
          />
          <Hospital className={`mx-auto mb-6 h-10 w-10 opacity-80 ${T.secLabel}`} />
          <h2 className={`text-3xl font-bold sm:text-4xl ${T.heading}`}>Подготвен да започнеш?</h2>
          <p className={`mx-auto mt-4 max-w-lg text-sm leading-relaxed ${T.muted}`}>
            Регистрирај се за неколку секунди. Нема кредитна картичка, нема скриени такси.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-push group flex items-center gap-2 px-8 py-3.5 text-sm shadow-xl"
            >
              Креирај бесплатна сметка
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/login" className={`flex items-center gap-2 rounded-full border px-8 py-3.5 text-sm font-semibold transition-all ${T.btnSecCta}`}>
              Веќе имам сметка
            </Link>
          </div>
        </motion.section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className={`mb-10 mt-16 flex flex-wrap items-center justify-between gap-4 border-t pt-8 text-xs ${T.footerBorder} ${T.footerText}`}>
          <div className="flex items-center gap-2">
            <Image src="/Logo-removebg-preview.png" alt="MedTech" width={22} height={22} className="opacity-50" />
            <span>MedTech 2026 · Македонија</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className={`transition-colors ${T.footerLink}`}>Функции</a>
            <a href="#portals" className={`transition-colors ${T.footerLink}`}>Портали</a>
            <Link href="/login" className={`transition-colors ${T.footerLink}`}>Најава</Link>
            <Link href="/register" className={`transition-colors ${T.footerLink}`}>Регистрација</Link>
          </div>
          <span>Сите права задржани Стефан Перовски</span>
        </footer>

      </div>
    </div>
  );
}
