"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Baby,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Search,
  Smile,
  Stethoscope,
  Star,
  Syringe,
  Wind,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { format, addDays, startOfDay, getDay, parseISO } from "date-fns";
import { mk as mkLocale } from "date-fns/locale";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Spinner } from "@/components/common/Spinner";
import { Input } from "@/components/common/Input";
import { extractErrorMessage } from "@/services/api";
import { doctorService } from "@/services/doctor.service";
import { appointmentService } from "@/services/appointment.service";
import { availabilityService } from "@/services/availability.service";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { initials } from "@/utils/format";
import type { AppointmentType, DoctorResponse } from "@/types/api";

interface BookAppointmentWizardProps {
  open: boolean;
  onClose: () => void;
  patientId: number;
  initialDoctor?: DoctorResponse;
}

// ── Specialties (icons only — labels come from translations) ──────────────
const SPECIALTY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Cardiology":        Heart,
  "Dermatology":       Activity,
  "Family Medicine":   Stethoscope,
  "Internal Medicine": Syringe,
  "Neurology":         Brain,
  "Pediatrics":        Baby,
  "Orthopedics":       Activity,
  "Psychiatry":        Smile,
  "Ophthalmology":     Eye,
  "Pulmonology":       Wind,
};

const SPECIALTY_VALUES = [
  "Cardiology", "Dermatology", "Family Medicine", "Internal Medicine",
  "Neurology", "Pediatrics", "Orthopedics", "Psychiatry", "Ophthalmology", "Pulmonology",
];

const APPOINTMENT_TYPE_VALUES: AppointmentType[] = [
  "CONSULTATION", "FOLLOW_UP", "PROCEDURE", "CHECKUP", "VIRTUAL",
];

// ── Slot generation ───────────────────────────────────────────────────────────
function generateSlots(startTime: string, endTime: string, interval = 30): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cur + interval <= end) {
    const h = String(Math.floor(cur / 60)).padStart(2, "0");
    const m = String(cur % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    cur += interval;
  }
  return slots;
}

function jsToIso(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

// ── Wizard ────────────────────────────────────────────────────────────────────
export function BookAppointmentWizard({ open, onClose, patientId, initialDoctor }: BookAppointmentWizardProps) {
  const t = useT();
  const wt = t.bookingWizard;

  const [step, setStep]                   = useState<1 | 2 | 3 | 4>(initialDoctor ? 3 : 1);
  const [specialty, setSpecialty]         = useState<string | null>(initialDoctor?.specialization ?? null);
  const [doctor, setDoctor]               = useState<DoctorResponse | null>(initialDoctor ?? null);
  const [date, setDate]                   = useState<string | null>(null);
  const [time, setTime]                   = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("CONSULTATION");
  const [reason, setReason]               = useState("");
  const [specSearch, setSpecSearch]       = useState("");
  const [docSearch, setDocSearch]         = useState("");

  const qc = useQueryClient();

  const stepTitles: Record<1 | 2 | 3 | 4, string> = {
    1: wt.step1Title,
    2: wt.step2Title,
    3: wt.step3Title,
    4: wt.step4Title,
  };

  const dateOptions = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i + 1)),
    [],
  );

  const doctorsQuery = useQuery({
    queryKey: ["doctors", { specialization: specialty }],
    queryFn: () => doctorService.search({ specialization: specialty ?? undefined, size: 50 }),
    enabled: step >= 2 && !!specialty,
  });

  const availQuery = useQuery({
    queryKey: ["availability", doctor?.id],
    queryFn: () => availabilityService.getForDoctor(doctor!.id),
    enabled: step >= 3 && !!doctor,
  });

  const bookedQuery = useQuery({
    queryKey: ["appointments-on", doctor?.id, date],
    queryFn: () => doctorService.appointmentsOn(doctor!.id, date!),
    enabled: step >= 3 && !!doctor && !!date,
  });

  const availableSlots = useMemo(() => {
    if (!date || !availQuery.data) return null;
    const jsDay = getDay(parseISO(date));
    const slot = availQuery.data.find((s) => s.dayOfWeek === jsToIso(jsDay) && s.active);
    if (!slot) return [];
    const all = generateSlots(slot.startTime, slot.endTime);
    const booked = new Set(
      (bookedQuery.data?.content ?? [])
        .filter((a) => a.status === "SCHEDULED" || a.status === "RESCHEDULED")
        .map((a) => a.appointmentTime.slice(0, 5)),
    );
    return all.map((t) => ({ time: t, disabled: booked.has(t) }));
  }, [date, availQuery.data, bookedQuery.data]);

  const bookMutation = useMutation({
    mutationFn: () => {
      if (!doctor || !date || !time) throw new Error("Incomplete selection");
      return appointmentService.book({
        doctorId: doctor.id,
        patientId,
        appointmentDate: date,
        appointmentTime: time,
        appointmentType,
        reason: reason || undefined,
        durationMinutes: 30,
      });
    },
    onSuccess: () => {
      toast.success(wt.booked);
      qc.invalidateQueries({ queryKey: ["appointments"] });
      reset();
      onClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const reset = () => {
    setStep(initialDoctor ? 3 : 1);
    setSpecialty(initialDoctor?.specialization ?? null);
    setDoctor(initialDoctor ?? null);
    setDate(null);
    setTime(null);
    setReason("");
    setAppointmentType("CONSULTATION");
    setSpecSearch("");
    setDocSearch("");
  };

  const handleClose = () => { reset(); onClose(); };

  const canAdvance =
    (step === 1 && !!specialty) ||
    (step === 2 && !!doctor)    ||
    (step === 3 && !!date && !!time) ||
    step === 4;

  const filteredSpecs = SPECIALTY_VALUES.filter((v) => {
    const label = t.specialties[v] ?? v;
    return (
      label.toLowerCase().includes(specSearch.toLowerCase()) ||
      v.toLowerCase().includes(specSearch.toLowerCase())
    );
  });

  const filteredDocs = (doctorsQuery.data?.content ?? []).filter((d) => {
    const q = docSearch.toLowerCase();
    return (
      d.firstName.toLowerCase().includes(q) ||
      d.lastName.toLowerCase().includes(q)  ||
      (d.hospitalName ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={stepTitles[step]}
      description={`${wt.stepLabel} ${step} ${wt.stepOf}`}
      size="lg"
      footer={
        <>
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}>
              <ChevronLeft className="h-4 w-4" />
              {t.common.back}
            </Button>
          )}
          {step < 4 ? (
            <Button
              onClick={() => { setStep((s) => (s + 1) as 1 | 2 | 3 | 4); }}
              disabled={!canAdvance}
            >
              {t.common.next}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => bookMutation.mutate()} loading={bookMutation.isPending}>
              <Check className="h-4 w-4" />
              {wt.confirmBtn}
            </Button>
          )}
        </>
      }
    >
      {/* Progress bar */}
      <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full bg-brand-500"
          initial={false}
          animate={{ width: `${(step / 4) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22 }}
        >
          {/* ── Step 1: Specialty ── */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={wt.searchSpecialty}
                  value={specSearch}
                  onChange={(e) => setSpecSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredSpecs.map((value) => {
                  const selected = specialty === value;
                  const Icon = SPECIALTY_ICONS[value] ?? Stethoscope;
                  const label = t.specialties[value] ?? value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setSpecialty(value); setDoctor(null); }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-all",
                        selected
                          ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/50",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", selected ? "text-brand-600" : "text-slate-400")} />
                      {label}
                    </button>
                  );
                })}
                {filteredSpecs.length === 0 && (
                  <p className="col-span-full py-6 text-center text-sm text-slate-400">{wt.noResults}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Doctor ── */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={wt.searchDoctor}
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              {doctorsQuery.isLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : filteredDocs.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  {docSearch
                    ? wt.noDoctorsSearch
                    : `${wt.noDoctorsSpecialty} ${t.specialties[specialty ?? ""] ?? specialty}.`}
                </p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {filteredDocs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => { setDoctor(d); setDate(null); setTime(null); }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                        doctor?.id === d.id
                          ? "border-brand-500 bg-brand-50 shadow-sm"
                          : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/40",
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                        {initials(d.firstName, d.lastName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">Dr. {d.firstName} {d.lastName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {t.specialties[d.specialization] ?? d.specialization}
                          {d.hospitalName ? ` · ${d.hospitalName}` : ""}
                        </p>
                      </div>
                      {d.averageRating != null && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-600">{d.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Date & Time ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{wt.dateLabel}</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {dateOptions.map((d) => {
                    const value = format(d, "yyyy-MM-dd");
                    const selected = date === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setDate(value); setTime(null); }}
                        className={cn(
                          "flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2 transition-all",
                          selected
                            ? "border-brand-500 bg-brand-500 text-white shadow"
                            : "border-slate-200 bg-white text-slate-700 hover:border-brand-300",
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          {format(d, "EEE", { locale: mkLocale })}
                        </span>
                        <span className="text-lg font-bold leading-tight">{format(d, "d")}</span>
                        <span className="text-[10px] opacity-80">{format(d, "MMM", { locale: mkLocale })}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{wt.timeLabel}</p>
                {!date ? (
                  <p className="text-sm text-slate-400">{wt.selectDateFirst}</p>
                ) : availQuery.isLoading || bookedQuery.isLoading ? (
                  <div className="flex justify-center py-4"><Spinner /></div>
                ) : !availableSlots || availableSlots.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 py-6 text-center">
                    <p className="text-sm text-slate-500">{wt.noScheduleDay}</p>
                    <p className="mt-1 text-xs text-slate-400">{wt.noScheduleHint}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {availableSlots.map(({ time: t, disabled }) => {
                      const selected = time === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={disabled}
                          onClick={() => setTime(t)}
                          className={cn(
                            "rounded-lg border px-2 py-2 text-sm font-medium transition-all",
                            disabled
                              ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                              : selected
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/40",
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 4: Confirm ── */}
          {step === 4 && doctor && date && time && (
            <div className="space-y-4">
              <div className="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">{wt.fieldDoctor}</p>
                    <p className="mt-0.5 font-semibold text-slate-900">Dr. {doctor.firstName} {doctor.lastName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">{wt.fieldSpecialty}</p>
                    <p className="mt-0.5 font-semibold text-slate-900">{t.specialties[doctor.specialization] ?? doctor.specialization}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">{wt.fieldWhen}</p>
                    <p className="mt-0.5 font-semibold text-slate-900">
                      {format(new Date(date), "d MMMM yyyy", { locale: mkLocale })} {wt.fieldWhen.toLowerCase() !== "when" ? "во" : "at"} {time}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">{wt.fieldHospital}</p>
                    <p className="mt-0.5 font-semibold text-slate-900">{doctor.hospitalName ?? "—"}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{wt.fieldType}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {APPOINTMENT_TYPE_VALUES.map((typeVal) => (
                    <button
                      key={typeVal}
                      type="button"
                      onClick={() => setAppointmentType(typeVal)}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-sm font-medium transition-all",
                        appointmentType === typeVal
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-slate-200 text-slate-700 hover:border-brand-300",
                      )}
                    >
                      {wt.apptTypes[typeVal] ?? typeVal}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label={wt.fieldReason}
                placeholder={wt.fieldReasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}
