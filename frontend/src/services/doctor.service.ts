// API сервис: повици за доктори.
import { api } from "./api";
import type { AppointmentResponse, DoctorResponse, Page } from "@/types/api";

export interface UpdateDoctorRequest {
  qualification?: string;
  experienceYears?: number;
  officeNumber?: string;
  consultationFee?: number;
  availabilityHours?: string;
  bio?: string;
}

interface DoctorSearchParams {
  specialization?: string;
  hospitalId?: number;
  city?: string;
  page?: number;
  size?: number;
}

export const doctorService = {
  search: (params: DoctorSearchParams = {}) =>
    api
      .get<Page<DoctorResponse>>("/doctors", {
        params: { page: 0, size: 20, ...params },
      })
      .then((r) => r.data),

  getById: (id: number) =>
    api.get<DoctorResponse>(`/doctors/${id}`).then((r) => r.data),

  me: () => api.get<DoctorResponse>("/doctors/me").then((r) => r.data),

  updateMe: (body: UpdateDoctorRequest) =>
    api.put<DoctorResponse>("/doctors/me", body).then((r) => r.data),

  appointmentsOn: (doctorId: number, isoDate: string, page = 0, size = 100) =>
    api
      .get<Page<AppointmentResponse>>(`/appointments/doctor/${doctorId}`, {
        params: { date: isoDate, page, size, sort: "appointmentTime,asc" },
      })
      .then((r) => r.data),

  appointmentsInRange: (doctorId: number, from: string, to: string, size = 100) =>
    api
      .get<Page<AppointmentResponse>>(`/appointments/doctor/${doctorId}/range`, {
        params: { from, to, page: 0, size, sort: "appointmentDate,asc" },
      })
      .then((r) => r.data),
};
