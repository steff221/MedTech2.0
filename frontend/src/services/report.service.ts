// API сервис: повици за извештаите на докторите.
import { api } from "./api";
import type { DoctorReportResponse, Page } from "@/types/api";

export interface GenerateReportRequest {
  periodType: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  year: number;
  periodUnit?: number;
}

export const reportService = {
  myReports: (page = 0, size = 50) =>
    api.get<Page<DoctorReportResponse>>("/reports/my", { params: { page, size } }).then((r) => r.data),

  generate: (body: GenerateReportRequest) =>
    api.post<DoctorReportResponse>("/reports", body).then((r) => r.data),

  submit: (id: number) =>
    api.put<DoctorReportResponse>(`/reports/${id}/submit`).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/reports/${id}`),
};
