import { api } from "./api";
import type {
  CreateMedicalRecordRequest,
  MedicalRecordResponse,
} from "@/types/api";

export const medicalRecordService = {
  create: (body: CreateMedicalRecordRequest) =>
    api.post<MedicalRecordResponse>("/medical-records", body).then((r) => r.data),

  getById: (id: number) =>
    api.get<MedicalRecordResponse>(`/medical-records/${id}`).then((r) => r.data),
};
