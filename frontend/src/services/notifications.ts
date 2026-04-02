import { api } from "./api";
import type { AppNotification } from "@/types/notification";

type NotificationListResponse = {
  success?: boolean;
  items: AppNotification[];
};

type NotificationCountResponse = {
  success?: boolean;
  count: number;
};

type GenericNotificationResponse = {
  success?: boolean;
  message?: string;
};

export const notificationsService = {
  async list() {
    const response = await api.get<NotificationListResponse>("/notifications/");
    return response.data;
  },

  async unreadCount() {
    const response = await api.get<NotificationCountResponse>(
      "/notifications/unread-count/"
    );
    return response.data;
  },

  async markAsRead(notificationId: number) {
    const response = await api.patch<GenericNotificationResponse>(
      `/notifications/${notificationId}/read/`
    );
    return response.data;
  },

  async markAsUnread(notificationId: number) {
    const response = await api.patch<GenericNotificationResponse>(
      `/notifications/${notificationId}/unread/`
    );
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch<GenericNotificationResponse>(
      "/notifications/mark-all-read/"
    );
    return response.data;
  },

  async remove(notificationId: number) {
    const response = await api.delete<GenericNotificationResponse>(
      `/notifications/${notificationId}/`
    );
    return response.data;
  },

  async clearRead() {
    const response = await api.delete<GenericNotificationResponse>(
      "/notifications/clear-read/"
    );
    return response.data;
  },
};