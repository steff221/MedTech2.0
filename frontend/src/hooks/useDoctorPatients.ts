"use client";

import { useQuery } from "@tanstack/react-query";
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

export function useDoctorPatients(doctorId: number | undefined) {
  const { from, to } = useMemo(() => {
    const start = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), -21);
    const end   = addDays(start, 41);
    return { from: format(start, "yyyy-MM-dd"), to: format(end, "yyyy-MM-dd") };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-appointments-range", doctorId, from, to],
    queryFn: () => doctorService.appointmentsInRange(doctorId!, from, to),
    enabled: !!doctorId,
    staleTime: 5 * 60 * 1000,
  });

  const summaries: DoctorPatientSummary[] = useMemo(() => {
    const all: AppointmentResponse[] = data?.content ?? [];
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
      const past   = s.appointments.filter((a) => new Date(a.appointmentDate) < now && a.status !== "SCHEDULED");
      const future = s.appointments.filter((a) => a.status === "SCHEDULED" && new Date(a.appointmentDate) >= now);
      s.lastSeen        = past[past.length - 1]?.appointmentDate ?? null;
      s.nextAppointment = future[0] ?? null;
      s.hasUrgent       = s.appointments.some((a) => a.appointmentType === "PROCEDURE" && a.status === "SCHEDULED");
    });

    return Array.from(map.values()).sort((a, b) => {
      const ai = a.nextAppointment?.appointmentDate ?? a.lastSeen ?? "";
      const bi = b.nextAppointment?.appointmentDate ?? b.lastSeen ?? "";
      return bi.localeCompare(ai);
    });
  }, [data]);

  return { summaries, isLoading };
}
