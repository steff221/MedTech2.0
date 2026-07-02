// API сервис: повици за термини.
import { api } from "./api";
import type { AppointmentResponse, BookAppointmentRequest } from "@/types/api";

export const appointmentService = {
  today: () =>
    api.get<AppointmentResponse[]>("/appointments/today").then((r) => r.data),

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
