"use client";

import { useQueries } from "@tanstack/react-query";
import { addDays, format, startOfWeek } from "date-fns";
import { useMemo } from "react";
import { doctorService } from "@/services/doctor.service";
import type { AppointmentResponse } from "@/types/api";

export interface DoctorPatientSummary {
  patientId: number;
  patientName: string;
  appointments: AppointmentResponse[];
  lastSeen: string | null;
  nextAppointment: AppointmentResponse | null;
  hasUrgent: boolean;
}

/**
 * No backend endpoint returns "this doctor's patients", so we derive it from
 * appointments across a 6-week window centered on today (3 past, 3 future).
 * For larger windows or higher patient volumes the right answer is a backend
 * endpoint; this is the pragmatic version that uses what's already there.
 */
export function useDoctorPatients(doctorId: number | undefined) {
  const days = useMemo(() => {
    const start = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), -21);
    return Array.from({ length: 42 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
  }, []);

  const queries = useQueries({
    queries: days.map((iso) => ({
      queryKey: ["doctor-appointments", doctorId, iso],
      queryFn: () => doctorService.appointmentsOn(doctorId!, iso),
      enabled: !!doctorId,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const all: AppointmentResponse[] = useMemo(
    () => queries.flatMap((q) => q.data?.content ?? []),
    [queries],
  );

  const summaries: DoctorPatientSummary[] = useMemo(() => {
    const map = new Map<number, DoctorPatientSummary>();
    const now = new Date();

    all.forEach((apt) => {
      const existing = map.get(apt.patientId) ?? {
        patientId: apt.patientId,
        patientName: apt.patientName,
        appointments: [],
        lastSeen: null,
        nextAppointment: null,
        hasUrgent: false,
      };
      existing.appointments.push(apt);
      map.set(apt.patientId, existing);
    });

    map.forEach((s) => {
      s.appointments.sort((a, b) =>
        (a.appointmentDate + a.appointmentTime).localeCompare(
          b.appointmentDate + b.appointmentTime,
        ),
      );
      const past = s.appointments.filter(
        (a) => new Date(a.appointmentDate) < now && a.status !== "SCHEDULED",
      );
      const future = s.appointments.filter(
        (a) => a.status === "SCHEDULED" && new Date(a.appointmentDate) >= now,
      );
      s.lastSeen = past[past.length - 1]?.appointmentDate ?? null;
      s.nextAppointment = future[0] ?? null;
      s.hasUrgent = s.appointments.some(
        (a) => a.appointmentType === "PROCEDURE" && a.status === "SCHEDULED",
      );
    });

    return Array.from(map.values()).sort((a, b) => {
      // Most-recently-active first
      const ai = a.nextAppointment?.appointmentDate ?? a.lastSeen ?? "";
      const bi = b.nextAppointment?.appointmentDate ?? b.lastSeen ?? "";
      return bi.localeCompare(ai);
    });
  }, [all]);

  return { summaries, isLoading };
}
