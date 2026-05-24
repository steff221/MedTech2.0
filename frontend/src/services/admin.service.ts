import { api } from "./api";
import type { Page, UserResponse } from "@/types/api";

export interface InviteStaffRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: "DOCTOR" | "NURSE";
  hospitalId?: number;
  licenseNumber?: string;
  specialization?: string;
}

export const adminService = {
  listUsers: (page = 0, size = 20) =>
    api
      .get<Page<UserResponse>>("/admin/users", { params: { page, size, sort: "createdAt,desc" } })
      .then((r) => r.data),

  invite: (body: InviteStaffRequest) =>
    api.post<UserResponse>("/admin/invite", body).then((r) => r.data),

  suspend: (id: number) =>
    api.put<UserResponse>(`/admin/users/${id}/suspend`).then((r) => r.data),

  activate: (id: number) =>
    api.put<UserResponse>(`/admin/users/${id}/activate`).then((r) => r.data),

  resendInvite: (id: number) =>
    api.post<UserResponse>(`/admin/users/${id}/resend-invite`).then((r) => r.data),
};
