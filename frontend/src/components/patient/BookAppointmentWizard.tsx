"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { format, addDays, startOfDay } from "date-fns";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Spinner } from "@/components/common/Spinner";
import { Input } from "@/components/common/Input";
import { extractErrorMessage } from "@/services/api";
import { doctorService } from "@/services/doctor.service";
import { appointmentService } from "@/services/appointment.service";
import { cn } from "@/utils/cn";
import { formatTime, initials } from "@/utils/format";
import type { AppointmentType, DoctorResponse } from "@/types/api";

interface BookAppointmentWizardProps {
  open: boolean;
  onClose: () => void;
  patientId: number;
}

const SPECIALTIES = [
  "Cardiology",
  "Dermatology",
  "Family Medicine",
  "Internal Medicine",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Psychiatry",
];

const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
  { value: "CONSULTATION", label: "Consultation" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "PROCEDURE", label: "Procedure" },
  { value: "CHECKUP", label: "Checkup" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30",
];

type Step = 1 | 2 | 3 | 4;

const STEP_TITLES: Record<Step, string> = {
  1: "Choose specialty",
  2: "Choose doctor",
  3: "Pick date & time",
  4: "Confirm booking",
};

export function BookAppointmentWizard({ open, onClose, patientId }: BookAppointmentWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<DoctorResponse | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("CONSULTATION");
  const [reason, setReason] = useState("");

  const qc = useQueryClient();

  const dateOptions = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, []);

  const doctorsQuery = useQuery({
    queryKey: ["doctors", { specialization: specialty }],
    queryFn: () => doctorService.search({ specialization: specialty ?? undefined, size: 30 }),
    enabled: step >= 2 && !!specialty,
  });

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
      toast.success("Appointment booked");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      reset();
      onClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const reset = () => {
    setStep(1);
    setSpecialty(null);
    setDoctor(null);
    setDate(null);
    setTime(null);
    setReason("");
    setAppointmentType("CONSULTATION");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canAdvance =
    (step === 1 && !!specialty) ||
    (step === 2 && !!doctor) ||
    (step === 3 && !!date && !!time) ||
    step === 4;

  const progress = (step / 4) * 100;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={STEP_TITLES[step]}
      description={`Step ${step} of 4`}
      size="lg"
      footer={
        <>
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as Step)}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canAdvance}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => bookMutation.mutate()} loading={bookMutation.isPending}>
              <Check className="h-4 w-4" />
              Confirm booking
            </Button>
          )}
        </>
      }
    >
      <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full bg-brand-500"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
        >
          {step === 1 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpecialty(s)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-sm font-medium transition-all",
                    specialty === s
                      ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/50",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div>
              {doctorsQuery.isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : !doctorsQuery.data?.content.length ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No doctors found for {specialty}. Try another specialty.
                </p>
              ) : (
                <div className="space-y-2">
                  {doctorsQuery.data.content.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDoctor(d)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                        doctor?.id === d.id
                          ? "border-brand-500 bg-brand-50 shadow-sm"
                          : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/40",
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                        {initials(d.firstName, d.lastName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">
                          Dr. {d.firstName} {d.lastName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {d.specialization}
                          {d.hospitalName ? ` · ${d.hospitalName}` : ""}
                        </p>
                      </div>
                      {d.experienceYears != null && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {d.experienceYears}y
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {dateOptions.map((d) => {
                    const value = format(d, "yyyy-MM-dd");
                    const selected = date === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDate(value)}
                        className={cn(
                          "flex shrink-0 flex-col items-center rounded-xl border px-4 py-2 transition-all",
                          selected
                            ? "border-brand-500 bg-brand-500 text-white shadow"
                            : "border-slate-200 bg-white text-slate-700 hover:border-brand-300",
                        )}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide">
                          {format(d, "EEE")}
                        </span>
                        <span className="text-lg font-bold">{format(d, "d")}</span>
                        <span className="text-[10px]">{format(d, "MMM")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Time
                </p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {TIME_SLOTS.map((t) => {
                    const selected = time === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-sm font-medium transition-all",
                          selected
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/40",
                        )}
                      >
                        {formatTime(t)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 4 && doctor && date && time && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Doctor</p>
                    <p className="font-semibold text-slate-900">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Specialty</p>
                    <p className="font-semibold text-slate-900">{doctor.specialization}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">When</p>
                    <p className="font-semibold text-slate-900">
                      {format(new Date(date), "MMM d, yyyy")} at {formatTime(time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Hospital</p>
                    <p className="font-semibold text-slate-900">{doctor.hospitalName ?? "—"}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Appointment type
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {APPOINTMENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setAppointmentType(t.value)}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-sm font-medium transition-all",
                        appointmentType === t.value
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-slate-200 text-slate-700 hover:border-brand-300",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Reason (optional)"
                placeholder="e.g. annual checkup, persistent headache…"
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
