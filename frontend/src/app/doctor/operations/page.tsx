"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { PageBanner } from "@/components/layout/PageBanner";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { operationService } from "@/services/operation.service";
import { patientService } from "@/services/patient.service";
import { hospitalService } from "@/services/hospital.service";
import type { HospitalResponse, OperationResponse, OperationStatus, PatientResponse, ScheduleOperationRequest } from "@/types/api";
import { cn } from "@/utils/cn";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatScheduled(date: string, time: string | null): string {
  const d = new Date(date + (time ? `T${time}` : ""));
  return `${d.toLocaleDateString("mk-MK", { day: "2-digit", month: "2-digit", year: "numeric" })}${time ? ` ${time}` : ""}`;
}

// ── Schedule modal ────────────────────────────────────────────────────────────

interface ScheduleModalProps {
  onClose: () => void;
  onCreated: (op: OperationResponse) => void;
}

function ScheduleModal({ onClose, onCreated }: ScheduleModalProps) {
  const t = useT();

  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<Omit<ScheduleOperationRequest, "patientId" | "hospitalId">>({
    operationName: "",
    operationDate: "",
    operationTime: "",
    durationMinutes: undefined,
    operationRoom: "",
    anesthesiaType: "",
    anesthesiologist: "",
    surgicalTeam: "",
    preOperativeNotes: "",
    implantsUsed: "",
  });
  const [hospitalId, setHospitalId] = useState<number | "">("");

  // Load hospitals once
  useEffect(() => {
    hospitalService.listActive().then(setHospitals).catch(() => {});
  }, []);

  // Patient search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!patientQuery.trim() || selectedPatient) { setPatientResults([]); return; }
    searchTimer.current = setTimeout(() => {
      patientService.search(patientQuery, 0, 8).then((p) => setPatientResults(p.content)).catch(() => {});
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [patientQuery, selectedPatient]);

  const set = (field: keyof typeof form, value: string | number | undefined) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !hospitalId) return;
    setSubmitting(true);
    try {
      const body: ScheduleOperationRequest = {
        ...form,
        patientId: selectedPatient.id,
        hospitalId: hospitalId as number,
        durationMinutes: form.durationMinutes || undefined,
      };
      const created = await operationService.schedule(body);
      toast.success(t.doctorOperations.successMsg);
      onCreated(created);
      onClose();
    } catch {
      toast.error("Грешка при закажување. Обидете се повторно.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{t.doctorOperations.scheduleTitle}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Patient search */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t.doctorOperations.fieldPatient} *</label>
            {selectedPatient ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm">
                <span className="font-medium text-emerald-800">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientQuery(""); }}
                  className="ml-2 text-emerald-600 hover:text-emerald-800"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  placeholder={t.doctorOperations.fieldPatientHint}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                {patientResults.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                    {patientResults.map((p) => (
                      <li key={p.id}>
                        <button type="button"
                          onClick={() => { setSelectedPatient(p); setPatientQuery(""); setPatientResults([]); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50">
                          <span className="font-medium text-slate-900">{p.firstName} {p.lastName}</span>
                          <span className="ml-2 text-xs text-slate-400">{p.email}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Hospital */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t.doctorOperations.fieldHospital} *</label>
            <select
              required
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">— избери болница —</option>
              {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.city})</option>)}
            </select>
          </div>

          {/* Operation name */}
          <Input
            label={`${t.doctorOperations.fieldOpName} *`}
            required
            value={form.operationName}
            onChange={(e) => set("operationName", e.target.value)}
            placeholder="пр. Лапароскопска холецистектомија"
          />

          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`${t.doctorOperations.fieldDate} *`}
              type="date"
              required
              value={form.operationDate}
              onChange={(e) => set("operationDate", e.target.value)}
            />
            <Input
              label={t.doctorOperations.fieldTime}
              type="time"
              value={form.operationTime ?? ""}
              onChange={(e) => set("operationTime", e.target.value)}
            />
          </div>

          {/* Duration + Room */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.doctorOperations.fieldDuration}
              type="number"
              min={1}
              value={form.durationMinutes ?? ""}
              onChange={(e) => set("durationMinutes", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="90"
            />
            <Input
              label={t.doctorOperations.fieldRoom}
              value={form.operationRoom ?? ""}
              onChange={(e) => set("operationRoom", e.target.value)}
              placeholder="Сала 2 (Лапароскопска)"
            />
          </div>

          {/* Anesthesia + Anesthesiologist */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.doctorOperations.fieldAnesthesia}
              value={form.anesthesiaType ?? ""}
              onChange={(e) => set("anesthesiaType", e.target.value)}
              placeholder="Општа"
            />
            <Input
              label={t.doctorOperations.fieldAnesthesiologist}
              value={form.anesthesiologist ?? ""}
              onChange={(e) => set("anesthesiologist", e.target.value)}
            />
          </div>

          {/* Surgical team */}
          <Input
            label={t.doctorOperations.fieldTeam}
            value={form.surgicalTeam ?? ""}
            onChange={(e) => set("surgicalTeam", e.target.value)}
            placeholder="Хирург Димитров, Мед. сестра Стоева…"
          />

          {/* Implants */}
          <Input
            label={t.doctorOperations.fieldImplants}
            value={form.implantsUsed ?? ""}
            onChange={(e) => set("implantsUsed", e.target.value)}
          />

          {/* Pre-op notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t.doctorOperations.fieldPreOpNotes}</label>
            <textarea
              rows={3}
              value={form.preOperativeNotes ?? ""}
              onChange={(e) => set("preOperativeNotes", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>{t.common.cancel ?? "Откажи"}</Button>
            <Button type="submit" disabled={submitting || !selectedPatient || !hospitalId}>
              {submitting ? "…" : t.doctorOperations.submitBtn}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Status helpers ────────────────────────────────────────────────────────────

type TonedStatus = { label: string; tone: "success" | "warning" | "info" | "neutral" | "danger" };

function useStatusMeta(): Record<OperationStatus, TonedStatus> {
  const t = useT();
  return useMemo(() => ({
    SCHEDULED:   { label: t.doctorOperations.statusScheduled,   tone: "info"    },
    IN_PROGRESS: { label: t.doctorOperations.statusInProgress,  tone: "warning" },
    COMPLETED:   { label: t.doctorOperations.statusCompleted,   tone: "success" },
    CANCELLED:   { label: t.doctorOperations.statusCancelled,   tone: "neutral" },
  }), [t]);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const { user } = useAuth();
  const t = useT();
  const statusMeta = useStatusMeta();

  const [operations, setOperations] = useState<OperationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OperationStatus | "ALL">("ALL");
  const [date, setDate] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    operationService.myOperations(0, 100)
      .then((p) => setOperations(p.content))
      .catch(() => toast.error("Неуспешно вчитување на операции."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() =>
    operations.filter((op) => {
      if (statusFilter !== "ALL" && op.status !== statusFilter) return false;
      if (date && op.operationDate !== date) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!op.operationName.toLowerCase().includes(q) &&
            !op.doctorName.toLowerCase().includes(q) &&
            !(op.operationRoom ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    }),
    [operations, statusFilter, date, search],
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = operations.filter((o) => o.operationDate === today).length;
  const inProgressCount = operations.filter((o) => o.status === "IN_PROGRESS").length;
  const completedMonth = operations.filter(
    (o) => o.status === "COMPLETED" && o.operationDate.startsWith(new Date().toISOString().slice(0, 7)),
  ).length;

  const STATUSES: Array<OperationStatus | "ALL"> = ["ALL", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  const statusLabel = (s: OperationStatus | "ALL") =>
    s === "ALL" ? t.common.all : statusMeta[s].label;

  return (
    <>
      <PageBanner title={t.doctorNav.operations} breadcrumb={[{ label: t.doctorNav.operations }]} />

      <div className="mx-auto max-w-7xl space-y-5 px-6 py-6">
        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {[
            { label: t.doctorOperations.statsToday,          value: todayCount },
            { label: t.doctorOperations.statsInProgress,     value: inProgressCount },
            { label: t.doctorOperations.statsCompletedMonth, value: completedMonth },
            { label: t.doctorOperations.statsTotal,          value: operations.length },
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

            {/* Schedule button */}
            <Button fullWidth onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              {t.doctorOperations.scheduleBtn}
            </Button>

            <div>
              <p className="mb-1.5 block text-sm font-medium text-slate-700">{t.doctorOperations.filterStatus}</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button key={s} type="button" onClick={() => setStatusFilter(s)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      statusFilter === s
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                    )}
                  >
                    {statusLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 block text-sm font-medium text-slate-700">{t.doctorOperations.filterDate}</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              {date && (
                <button onClick={() => setDate("")} className="mt-1 text-xs text-slate-400 hover:text-slate-600">
                  {t.doctorOperations.filterReset}
                </button>
              )}
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

            <Button variant="secondary" fullWidth
              onClick={() => { setStatusFilter("ALL"); setDate(""); setSearch(""); }}>
              {t.doctorOperations.filterReset}
            </Button>
          </Card>

          {/* Operations list */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {t.doctorOperations.resultsLabel} ({filtered.length})
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {loading && (
                  <p className="py-10 text-center text-sm text-slate-400">Се вчитува…</p>
                )}
                {!loading && filtered.length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-400">
                    {t.doctorOperations.noOps}
                  </p>
                )}

                {!loading && filtered.map((op, i) => {
                  const s = statusMeta[op.status];
                  return (
                    <motion.div
                      key={op.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4 hover:bg-emerald-50/30"
                    >
                      <div className="flex items-start gap-4">
                        {/* Left */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-slate-400">#{op.id}</span>
                            <Badge tone={s.tone}>{s.label}</Badge>
                            {op.status === "IN_PROGRESS" && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                                {t.doctorOperations.activeLabel}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-base font-semibold text-slate-900">{op.operationName}</p>
                          <p className="mt-0.5 text-sm font-medium text-slate-700">{op.hospitalName}</p>
                          {op.surgicalTeam && (
                            <p className="mt-0.5 text-xs text-slate-500">{op.surgicalTeam}</p>
                          )}
                          {op.preOperativeNotes && (
                            <p className="mt-2 text-xs text-slate-600">{op.preOperativeNotes}</p>
                          )}
                        </div>

                        {/* Right — fixed width, always aligned */}
                        <div className="w-44 shrink-0 text-right">
                          <p className="flex items-center justify-end gap-1 text-sm font-medium text-slate-700">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatScheduled(op.operationDate, op.operationTime)}
                          </p>
                          {op.durationMinutes && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {op.durationMinutes} {t.doctorOperations.minutesShort}
                              {op.anesthesiaType ? ` · ${op.anesthesiaType}` : ""}
                            </p>
                          )}
                          {op.operationRoom && (
                            <p className="mt-0.5 text-xs text-slate-500">{op.operationRoom}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Schedule modal */}
      <AnimatePresence>
        {showModal && (
          <ScheduleModal
            onClose={() => setShowModal(false)}
            onCreated={(op) => setOperations((prev) => [op, ...prev])}
          />
        )}
      </AnimatePresence>
    </>
  );
}
