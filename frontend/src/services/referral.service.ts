import { api } from "./api";
import type {
  CompleteReferralRequest,
  CreateReferralRequest,
  Page,
  ReferralResponse,
  ReferralStatus,
} from "@/types/api";

export const referralService = {
  create: (body: CreateReferralRequest) =>
    api.post<ReferralResponse>("/referrals", body).then((r) => r.data),

  getById: (id: number) =>
    api.get<ReferralResponse>(`/referrals/${id}`).then((r) => r.data),

  complete: (id: number, body: CompleteReferralRequest) =>
    api.put<ReferralResponse>(`/referrals/${id}/complete`, body).then((r) => r.data),

  cancel: (id: number) =>
    api.delete<ReferralResponse>(`/referrals/${id}`).then((r) => r.data),

  myReferrals: (status?: ReferralStatus, page = 0, size = 50) =>
    api
      .get<Page<ReferralResponse>>("/referrals/my", {
        params: { ...(status ? { status } : {}), page, size, sort: "createdAt,desc" },
      })
      .then((r) => r.data),

  patientReferrals: (patientId: number, page = 0, size = 20) =>
    api
      .get<Page<ReferralResponse>>(`/referrals/patient/${patientId}`, {
        params: { page, size, sort: "createdAt,desc" },
      })
      .then((r) => r.data),
};
