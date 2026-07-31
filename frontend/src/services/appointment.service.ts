// API сервис: повици за термини.
import { api } from "./api";
import type { AppointmentResponse, BookAppointmentRequest, Page } from "@/types/api";

// Local calendar date as yyyy-MM-dd. Deliberately not toISOString(), which
// shifts to UTC and can report "yesterday" for evening appointments.
function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const appointmentService = {
  // Front-desk view: every doctor's appointments today (NURSE/ADMIN only).
  today: () =>
    api.get<AppointmentResponse[]>("/appointments/today").then((r) => r.data),

  // A single doctor's own day — what the doctor portal is allowed to read.
  todayForDoctor: (doctorId: number) =>
    api
      .get<Page<AppointmentResponse>>(`/appointments/doctor/${doctorId}`, {
        params: { date: todayIso(), page: 0, size: 200, sort: "appointmentTime,asc" },
      })
      .then((r) => r.data.content),

  book: (body: BookAppointmentRequest) =>
    api.post<AppointmentResponse>("/appointments", body).then((r) => r.data),

  getById: (id: number) =>
    api.get<AppointmentResponse>(`/appointments/${id}`).then((r) => r.data),

  setVideoUrl: (id: number, videoCallUrl: string) =>
    api
      .put<AppointmentResponse>(`/appointments/${id}/video-url`, { videoCallUrl })
      .then((r) => r.data),

  cancel: (id: number, reason?: string) =>
    api
      .delete<AppointmentResponse>(`/appointments/${id}`, {
        data: reason ? { reason } : undefined,
      })
      .then((r) => r.data),
};
