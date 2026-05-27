import { api } from "./api";
import type {
  CreateMedicalRecordRequest,
  MedicalRecordEventResponse,
  MedicalRecordResponse,
} from "@/types/api";

export const medicalRecordService = {
  create: (body: CreateMedicalRecordRequest) =>
    api.post<MedicalRecordResponse>("/medical-records", body).then((r) => r.data),

  getById: (id: number) =>
    api.get<MedicalRecordResponse>(`/medical-records/${id}`).then((r) => r.data),

  getHistory: (id: number) =>
    api.get<MedicalRecordEventResponse[]>(`/medical-records/${id}/history`).then((r) => r.data),
};
