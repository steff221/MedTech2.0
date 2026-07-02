// API сервис: повици за рецепти.
import { api } from "./api";
import type {
  IssuePrescriptionRequest,
  Page,
  PrescriptionResponse,
} from "@/types/api";

export const prescriptionService = {
  issue: (body: IssuePrescriptionRequest) =>
    api.post<PrescriptionResponse>("/prescriptions", body).then((r) => r.data),

  cancel: (id: number) =>
    api.delete<PrescriptionResponse>(`/prescriptions/${id}`).then((r) => r.data),

  refill: (id: number) =>
    api.put<PrescriptionResponse>(`/prescriptions/${id}/refill`).then((r) => r.data),

  activeForPatient: (patientId: number, page = 0, size = 50) =>
    api
      .get<Page<PrescriptionResponse>>(`/prescriptions/patient/${patientId}/active`, {
        params: { page, size },
      })
      .then((r) => r.data),
};
