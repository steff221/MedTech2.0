import { api } from "./api";
import type { NotificationResponse } from "@/types/api";

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export const notificationService = {
  list: (page = 0, size = 20) =>
    api.get<Page<NotificationResponse>>("/notifications", { params: { page, size } }).then((r) => r.data),

  unreadCount: () =>
    api.get<{ count: number }>("/notifications/unread-count").then((r) => r.data.count),

  markRead: (id: number) =>
    api.patch<NotificationResponse>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () =>
    api.patch("/notifications/read-all"),
};
