// API сервис: повици за пациенти.
import { api } from "./api";
import type {
  AppointmentResponse,
  CreatePatientRequest,
  MedicalRecordResponse,
  Page,
  PatientResponse,
  PrescriptionResponse,
} from "@/types/api";

export const patientService = {
  search: (q: string, page = 0, size = 20, hospitalId?: number) =>
    api
      .get<Page<PatientResponse>>("/patients", {
        params: { q, page, size, ...(hospitalId ? { hospitalId } : {}) },
      })
      .then((r) => r.data),

  me: () => api.get<PatientResponse>("/patients/me").then((r) => r.data),

  byId: (id: number) =>
    api.get<PatientResponse>(`/patients/${id}`).then((r) => r.data),

  createSelfProfile: (body: CreatePatientRequest) =>
    api.post<PatientResponse>("/patients/me", body).then((r) => r.data),

  update: (id: number, body: Partial<CreatePatientRequest>) =>
    api.put<PatientResponse>(`/patients/${id}`, body).then((r) => r.data),

  appointments: (patientId: number, page = 0, size = 20) =>
    api
      .get<Page<AppointmentResponse>>(`/patients/${patientId}/appointments`, {
        params: { page, size, sort: "appointmentDate,desc" },
      })
      .then((r) => r.data),

  medicalRecords: (patientId: number, page = 0, size = 20) =>
    api
      .get<Page<MedicalRecordResponse>>(`/patients/${patientId}/medical-records`, {
        params: { page, size, sort: "createdAt,desc" },
      })
      .then((r) => r.data),

  prescriptions: (patientId: number, page = 0, size = 20) =>
    api
      .get<Page<PrescriptionResponse>>(`/patients/${patientId}/prescriptions`, {
        params: { page, size, sort: "startDate,desc" },
      })
      .then((r) => r.data),
};
