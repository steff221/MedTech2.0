import { api } from "./api";
import type {
  CreateRatingRequest,
  DoctorRatingSummaryResponse,
  Page,
  RatingResponse,
} from "@/types/api";

export const ratingService = {
  submit: (appointmentId: number, body: CreateRatingRequest) =>
    api
      .post<RatingResponse>(`/appointments/${appointmentId}/rating`, body)
      .then((r) => r.data),

  listForDoctor: (doctorId: number, page = 0, size = 10) =>
    api
      .get<Page<RatingResponse>>(`/doctors/${doctorId}/ratings`, {
        params: { page, size },
      })
      .then((r) => r.data),

  summaryForDoctor: (doctorId: number) =>
    api
      .get<DoctorRatingSummaryResponse>(`/doctors/${doctorId}/ratings/summary`)
      .then((r) => r.data),
};
