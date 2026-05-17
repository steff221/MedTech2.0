import { api } from "./api";
import type { AppointmentResponse, BookAppointmentRequest } from "@/types/api";

export const appointmentService = {
  book: (body: BookAppointmentRequest) =>
    api.post<AppointmentResponse>("/appointments", body).then((r) => r.data),

  getById: (id: number) =>
    api.get<AppointmentResponse>(`/appointments/${id}`).then((r) => r.data),

  cancel: (id: number, reason?: string) =>
    api
      .delete<AppointmentResponse>(`/appointments/${id}`, {
        data: reason ? { reason } : undefined,
      })
      .then((r) => r.data),
};
