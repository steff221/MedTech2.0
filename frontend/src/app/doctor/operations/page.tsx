"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { Clock, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { PageBanner } from "@/components/layout/PageBanner";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { translations } from "@/i18n/translations";
import { cn } from "@/utils/cn";

// ── Types ────────────────────────────────────────────────────────────────────
type OpStatus = "planned" | "in_progress" | "completed" | "cancelled";

interface Operation {
  id: string;
  patient: string;
  referralId: string;
  doctor: string;
  type: string;
  operationType: string;
  room: string;
  scheduledAt: string;
  durationMin: number;
  details: string;
  status: OpStatus;
  anesthesia: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_OPERATIONS: Operation[] = [
  {
    id: "OP-2026-012",
    patient: "Александар Стојановски",
    referralId: "UP-2026-002",
    doctor: "Dr. Перовски / Хирург Димитров",
    type: "Лапароскопска",
    operationType: "Лапароскопска холецистектомија",
    room: "Сала 2 (Лапароскопска)",
    scheduledAt: "2026-05-21T09:00",
    durationMin: 90,
    details: "Симптоматска холелитијаза, рекурентни колики. ASA II. Лапароскопски пристап.",
    status: "in_progress",
    anesthesia: "Општа",
  },
  {
    id: "OP-2026-011",
    patient: "Борче Димовски",
    referralId: "UP-2026-001",
    doctor: "Dr. Перовски / Хирург Јовановски",
    type: "Општа",
    operationType: "Лапаротомија — адхезиолиза",
    room: "Сала 1 (Општа)",
    scheduledAt: "2026-05-21T11:30",
    durationMin: 120,
    details: "Хронични болки во абдомен, суспектни адхезии по претходна аппендектомија.",
    status: "planned",
    anesthesia: "Општа",
  },
  {
    id: "OP-2026-010",
    patient: "Сања Велкоска",
    referralId: "UP-2026-003",
    doctor: "Dr. Перовски / Кардиохирург Петров",
    type: "Кардио",
    operationType: "Коронарна артериска бај-пас операција (CABG)",
    room: "Сала 3 (Кардиохирургија)",
    scheduledAt: "2026-05-22T08:00",
    durationMin: 240,
    details: "Тројносадовна КАБ болест. EF 48%. Суспендиран на нитрати. Прехирурш. консулт завршен.",
    status: "planned",
    anesthesia: "Општа + кардиопулмонален бај-пас",
  },
  {
    id: "OP-2026-009",
    patient: "Горан Трајковски",
    referralId: "UP-2026-004",
    doctor: "Dr. Перовски / Уролог Николовски",
    type: "Лапароскопска",
    operationType: "Трансуретрална ресекција на простата (TURP)",
    room: "Дневна болница",
    scheduledAt: "2026-05-19T10:00",
    durationMin: 75,
    details: "BPH со значајна опструкција. IPSS скор 22. PSA во норма.",
    status: "completed",
    anesthesia: "Спинална",
  },
  {
    id: "OP-2026-008",
    patient: "Марија Петровска",
    referralId: "UP-2025-041",
    doctor: "Dr. Перовски / Гинеколог Илиевска",
    type: "Гинеколошка",
    operationType: "Лапароскопска цистектомија на јајник",
    room: "Сала 2 (Лапароскопска)",
    scheduledAt: "2026-05-15T08:30",
    durationMin: 60,
    details: "Ендометриоза стадиум II. Цист 4cm на лев јајник. CA-125 нормален.",
    status: "completed",
    anesthesia: "Општа",
  },
  {
    id: "OP-2026-007",
    patient: "Методи Стефановски",
    referralId: "UP-2025-039",
    doctor: "Dr. Перовски / Ортопед Стојановски",
    type: "Ортопедска",
    operationType: "Тотална замена на колено (TKR) — десно",
    room: "Сала 1 (Општа)",
    scheduledAt: "2026-05-10T07:30",
    durationMin: 150,
    details: "Гонартроза стадиум IV (К-Л). BMI 26. Ехокардио уредно. Претходна физиотерапија 6 мес.",
    status: "completed",
    anesthesia: "Спинална + седација",
  },
  {
    id: "OP-2026-006",
    patient: "Елена Николовска",
    referralId: "UP-2025-036",
    doctor: "Dr. Перовски / Хирург Јовановски",
    type: "Општа",
    operationType: "Херниорафија (Lichtenstein) — ингвинална десна",
    room: "Дневна болница",
    scheduledAt: "2026-04-28T09:00",
    durationMin: 60,
    details: "Директна ингвинална хернија десно, рецидив. Пациентот без придружни заболувања. ASA I.",
    status: "completed",
    anesthesia: "Локална + седација",
  },
  {
    id: "OP-2026-005",
    patient: "Ана Коцевска",
    referralId: "UP-2025-033",
    doctor: "Dr. Перовски / Гинеколог Илиевска",
    type: "Гинеколошка",
    operationType: "Хистероскопска миомектомија",
    room: "Дневна болница",
    scheduledAt: "2026-05-23T10:30",
    durationMin: 45,
    details: "Субмукозен миом тип 0, 2.5cm. Метрорагија. Хемоглобин 110 g/L. ASA I.",
    status: "planned",
    anesthesia: "Кратка општа",
  },
  {
    id: "OP-2026-004",
    patient: "Горан Трајковски",
    referralId: "UP-2025-030",
    doctor: "Dr. Перовски / Хирург Димитров",
    type: "Лапароскопска",
    operationType: "Лапароскопска апендектомија",
    room: "Сала 2 (Лапароскопска)",
    scheduledAt: "2026-04-05T16:00",
    durationMin: 50,
    details: "Акутен апендицитис — ургентна операција. Алварадо скор 8. CT потврдено.",
    status: "completed",
    anesthesia: "Општа",
  },
  {
    id: "OP-2026-003",
    patient: "Борче Димовски",
    referralId: "UP-2025-028",
    doctor: "Dr. Перовски / Кардиолог Петров",
    type: "Кардио",
    operationType: "Перкутана коронарна интервенција (PCI) — стент LAD",
    room: "Сала 3 (Кардиохирургија)",
    scheduledAt: "2026-03-18T11:00",
    durationMin: 90,
    details: "ACS NSTEMI. Тројносадовна болест. Стент поставен во LAD. TIMI flow 3 post-PCI.",
    status: "cancelled",
    anesthesia: "Локална + седација",
  },
];

const OP_TYPES = ["Сите", "Општа", "Лапароскопска", "Кардио", "Гинеколошка", "Ортопедска"];
const ROOMS = ["Сала 1 (Општа)", "Сала 2 (Лапароскопска)", "Сала 3 (Кардиохирургија)", "Дневна болница"];
const STATUSES: Array<OpStatus | "Сите"> = ["Сите", "planned", "in_progress", "completed", "cancelled"];

export default function OperationsPage() {
  const { user } = useAuth();
  const t = useT();

  function formatScheduled(iso: string) {
    const d = new Date(iso);
    const lang = t === translations.en ? "en-GB" : "mk-MK";
    return `${d.toLocaleDateString(lang, { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })}`;
  }

  const STATUS_META = useMemo<Record<OpStatus, { label: string; tone: "success" | "warning" | "info" | "neutral" }>>(() => ({
    planned:     { label: t.doctorOperations.statusPlanned,     tone: "info"    },
    in_progress: { label: t.doctorOperations.statusInProgress,  tone: "warning" },
    completed:   { label: t.doctorOperations.statusCompleted,   tone: "success" },
    cancelled:   { label: t.doctorOperations.statusCancelled,   tone: "neutral" },
  }), [t]);

  const STATUS_FILTER_LABELS = useMemo<Record<OpStatus | "Сите", string>>(() => ({
    "Сите":       t.common.all,
    planned:      t.doctorOperations.statusPlanned,
    in_progress:  t.doctorOperations.statusInProgress,
    completed:    t.doctorOperations.statusCompleted,
    cancelled:    t.doctorOperations.statusCancelled,
  }), [t]);

  const [date, setDate] = useState("");
  const [opType, setOpType] = useState("Сите");
  const [room, setRoom] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OpStatus | "Сите">("Сите");
  const [search, setSearch] = useState("");

  const filtered = MOCK_OPERATIONS.filter((op) => {
    if (opType !== "Сите" && op.type !== opType) return false;
    if (room && op.room !== room) return false;
    if (statusFilter !== "Сите" && op.status !== statusFilter) return false;
    if (date && !op.scheduledAt.startsWith(date)) return false;
    if (
      search &&
      !op.patient.toLowerCase().includes(search.toLowerCase()) &&
      !op.operationType.toLowerCase().includes(search.toLowerCase()) &&
      !op.id.toLowerCase().includes(search.toLowerCase()) &&
      !op.referralId.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  // Stats
  const today = format(new Date(), "yyyy-MM-dd");
  const todayOps = MOCK_OPERATIONS.filter((o) => o.scheduledAt.startsWith(today));
  const inProgress = MOCK_OPERATIONS.filter((o) => o.status === "in_progress").length;
  const completedThisMonth = MOCK_OPERATIONS.filter(
    (o) => o.status === "completed" && o.scheduledAt.startsWith("2026-05"),
  ).length;

  return (
    <>
      <PageBanner title={t.doctorNav.operations} breadcrumb={[{ label: t.doctorNav.operations }]} />

      <div className="mx-auto max-w-7xl space-y-5 px-6 py-6">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { label: t.doctorOperations.statsToday,          value: todayOps.length.toString()        },
            { label: t.doctorOperations.statsInProgress,     value: inProgress.toString()             },
            { label: t.doctorOperations.statsCompletedMonth, value: completedThisMonth.toString()     },
            { label: t.doctorOperations.statsTotal,          value: MOCK_OPERATIONS.length.toString() },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
          {/* Left filter card */}
          <Card className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.doctorOperations.filterDoctor}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {user ? `Dr. ${user.firstName} ${user.lastName}` : "—"}
              </p>
            </div>

            <div>
              <p className="mb-1.5 block text-sm font-medium text-slate-700">{t.doctorOperations.filterDepartment}</p>
              <div className="flex flex-wrap gap-1.5">
                {OP_TYPES.map((opTypeKey) => (
                  <button
                    key={opTypeKey}
                    type="button"
                    onClick={() => setOpType(opTypeKey)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      opType === opTypeKey
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                    )}
                  >
                    {opTypeKey === "Сите" ? t.common.all : opTypeKey}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 block text-sm font-medium text-slate-700">{t.doctorOperations.filterStatus}</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      statusFilter === s
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                    )}
                  >
                    {STATUS_FILTER_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 block text-sm font-medium text-slate-700">{t.doctorOperations.filterRoom}</p>
              <select
                value={room ?? ""}
                onChange={(e) => setRoom(e.target.value || null)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">{t.doctorOperations.filterAllRooms}</option>
                {ROOMS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <p className="mb-1.5 block text-sm font-medium text-slate-700">{t.doctorOperations.filterSearch}</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.common.search}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            <Button
              variant="secondary"
              fullWidth
              onClick={() => { setOpType("Сите"); setRoom(null); setStatusFilter("Сите"); setSearch(""); setDate(""); }}
            >
              {t.doctorOperations.filterReset}
            </Button>
          </Card>

          {/* Main area */}
          <div className="space-y-4">
            <Card>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  label={t.doctorOperations.filterDate}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}
                  >
                    {t.doctorOperations.filterToday}
                  </Button>
                </div>
              </div>
            </Card>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {t.doctorOperations.resultsLabel} ({filtered.length})
                </p>
              </div>

              <div className="space-y-0 divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-400">
                    {t.doctorOperations.noOps}
                  </p>
                )}

                {filtered.map((op, i) => {
                  const s = STATUS_META[op.status];
                  return (
                    <motion.div
                      key={op.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4 hover:bg-emerald-50/30"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-slate-400">{op.id}</span>
                            <Badge tone={s.tone}>{s.label}</Badge>
                            {op.status === "in_progress" && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                                {t.doctorOperations.activeLabel}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-base font-semibold text-slate-900">{op.operationType}</p>
                          <p className="mt-0.5 text-sm font-medium text-slate-700">{op.patient}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{op.doctor}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="flex items-center gap-1 text-sm font-medium text-slate-700">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatScheduled(op.scheduledAt)}
                          </p>
                          <p className="text-xs text-slate-400">{op.durationMin} {t.doctorOperations.minutesShort} · {op.anesthesia}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{op.room}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">{op.details}</p>
                      <p className="mt-1 font-mono text-[10px] text-slate-400">{t.doctorOperations.referralLabel} {op.referralId}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
