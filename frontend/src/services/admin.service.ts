// API сервис: административни повици (корисници, болници, персонал).
import { api } from "./api";
import type { AuditLogResponse, NotificationResponse, Page, UserResponse } from "@/types/api";

export interface InviteStaffRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: "DOCTOR" | "GENERAL_PRACTITIONER" | "NURSE";
  hospitalId?: number;
  licenseNumber?: string;
  specialization?: string;
}

export const adminService = {
  listUsers: (page = 0, size = 20, hospitalId?: number) =>
    api
      .get<Page<UserResponse>>("/admin/users", {
        params: { page, size, sort: "createdAt,desc", ...(hospitalId ? { hospitalId } : {}) },
      })
      .then((r) => r.data),

  invite: (body: InviteStaffRequest) =>
    api.post<UserResponse>("/admin/invite", body).then((r) => r.data),

  suspend: (id: number) =>
    api.put<UserResponse>(`/admin/users/${id}/suspend`).then((r) => r.data),

  activate: (id: number) =>
    api.put<UserResponse>(`/admin/users/${id}/activate`).then((r) => r.data),

  resendInvite: (id: number) =>
    api.post<UserResponse>(`/admin/users/${id}/resend-invite`).then((r) => r.data),

  auditLogs: (params: { userId?: number; entityType?: string; entityId?: number; page?: number; size?: number }) =>
    api
      .get<Page<AuditLogResponse>>("/audit-logs", { params: { page: 0, size: 50, ...params } })
      .then((r) => r.data),

  anomalyAlerts: (page = 0, size = 50) =>
    api
      .get<Page<NotificationResponse>>("/notifications/by-type", { params: { type: "ANOMALY", page, size } })
      .then((r) => r.data),
};
