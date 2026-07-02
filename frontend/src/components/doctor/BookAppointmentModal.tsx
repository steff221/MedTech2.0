// React компонента: модал за закажување термин (доктор).
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { appointmentService } from "@/services/appointment.service";
import { patientService } from "@/services/patient.service";
import { availabilityService } from "@/services/availability.service";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { extractErrorMessage } from "@/services/api";
import type { PatientResponse } from "@/types/api";

const schema = z.object({
  appointmentDate: z.string().min(1, "Required"),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM format"),
  durationMinutes: z.coerce.number().int().positive(),
  appointmentType: z.enum(["CONSULTATION", "PROCEDURE", "FOLLOW_UP", "EMERGENCY"]),
  reason: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90];
const TYPE_OPTIONS: FormData["appointmentType"][] = ["CONSULTATION", "PROCEDURE", "FOLLOW_UP", "EMERGENCY"];

export function BookAppointmentModal({ open, onClose }: Props) {
  const t = useT();
  const bt = t.doctorBooking;
  const qc = useQueryClient();
  const { data: doctor } = useDoctorProfile();

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [showResults, setShowResults] = useState(false);

  const { data: patientResults } = useQuery({
    queryKey: ["patient-search", patientSearch],
    queryFn: () => patientService.search(patientSearch, 0, 8, doctor?.hospitalId ?? undefined),
    enabled: patientSearch.trim().length >= 2,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      durationMinutes: 30,
      appointmentType: "CONSULTATION",
      appointmentDate: new Date().toISOString().split("T")[0],
      appointmentTime: "09:00",
    },
  });

  const selectedDate = watch("appointmentDate");

  const { data: availabilitySlots } = useQuery({
    queryKey: ["doctor-availability", doctor?.id],
    queryFn: () => availabilityService.getForDoctor(doctor!.id),
    enabled: !!doctor,
  });

  const availabilityHint = (() => {
    if (!availabilitySlots || availabilitySlots.length === 0 || !selectedDate) return null;
    const dow = new Date(selectedDate + "T12:00:00").getDay(); // 0=Sun
    const isoDow = dow === 0 ? 7 : dow; // convert to ISO: 1=Mon…7=Sun
    const slot = availabilitySlots.find((s) => s.dayOfWeek === isoDow);
    if (!slot) return null;
    if (!slot.active) return { available: false, label: t.doctorAvailability.notAvailable };
    return {
      available: true,
      label: `${t.doctorAvailability.availableHint} ${slot.startTime.slice(0, 5)} – ${slot.endTime.slice(0, 5)}`,
    };
  })();

  const book = useMutation({
    mutationFn: (data: FormData) => {
      if (!selectedPatient || !doctor) throw new Error("Missing patient or doctor");
      return appointmentService.book({
        doctorId: doctor.id,
        patientId: selectedPatient.id,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        durationMinutes: data.durationMinutes,
        appointmentType: data.appointmentType as any,
        reason: data.reason || undefined,
      });
    },
    onSuccess: () => {
      toast.success(bt.success);
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments-today-waiting"] });
      handleClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err) ?? "Failed to book appointment"),
  });

  const handleClose = useCallback(() => {
    reset();
    setSelectedPatient(null);
    setPatientSearch("");
    onClose();
  }, [reset, onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (typeof window === "undefined") return null;

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed inset-x-0 top-[10vh] z-50 mx-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{bt.title}</h2>
                <p className="text-xs text-slate-500">{bt.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit((data) => book.mutate(data))}
              className="space-y-4 px-6 py-5"
            >
              {/* Patient search */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{bt.patient}</label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                      <p className="text-xs text-emerald-600">{selectedPatient.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                      className="rounded p-0.5 text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => { setPatientSearch(e.target.value); setShowResults(true); }}
                      onFocus={() => setShowResults(true)}
                      placeholder={bt.searchPatient}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    {showResults && (patientResults?.content?.length ?? 0) > 0 && (
                      <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                        {patientResults!.content.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setSelectedPatient(p); setShowResults(false); }}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                              {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{p.firstName} {p.lastName}</p>
                              <p className="text-xs text-slate-500">{p.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">{bt.date}</label>
                  <input
                    type="date"
                    {...register("appointmentDate")}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  {errors.appointmentDate && (
                    <p className="mt-1 text-xs text-rose-600">{errors.appointmentDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">{bt.time}</label>
                  <input
                    type="time"
                    {...register("appointmentTime")}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  {errors.appointmentTime && (
                    <p className="mt-1 text-xs text-rose-600">{errors.appointmentTime.message}</p>
                  )}
                </div>
              </div>

              {/* Availability hint */}
              {availabilityHint && (
                <div className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium",
                  availabilityHint.available
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-600",
                )}>
                  <span>{availabilityHint.available ? "✓" : "✗"}</span>
                  {availabilityHint.label}
                </div>
              )}

              {/* Duration + Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">{bt.duration}</label>
                  <select
                    {...register("durationMinutes")}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>{(bt.durations as Record<string, string>)[String(d)]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">{bt.type}</label>
                  <select
                    {...register("appointmentType")}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    {TYPE_OPTIONS.map((tp) => (
                      <option key={tp} value={tp}>{bt.types[tp]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{bt.reason}</label>
                <textarea
                  {...register("reason")}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  {t.common.cancel}
                </button>
                <Button
                  type="submit"
                  loading={book.isPending}
                  disabled={!selectedPatient}
                  title={!selectedPatient ? bt.noPatientSel : undefined}
                >
                  {bt.submit}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
