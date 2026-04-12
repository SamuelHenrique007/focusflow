import { api } from "./api";
import type { AppNotification } from "@/types/notification";

export type NotificationListResponse = {
  success?: boolean;
  items: AppNotification[];
};

export type NotificationCountResponse = {
  success?: boolean;
  count: number;
};

export type GenericNotificationResponse = {
  success?: boolean;
  message?: string;
};

export const notificationsService = {
  async list(): Promise<NotificationListResponse> {
    const response = await api.get<NotificationListResponse>("/notifications/");
    return response.data;
  },

  async unreadCount(): Promise<NotificationCountResponse> {
    const response = await api.get<NotificationCountResponse>(
      "/notifications/unread-count/"
    );
    return response.data;
  },

  async markAsRead(
    notificationId: number
  ): Promise<GenericNotificationResponse> {
    const response = await api.patch<GenericNotificationResponse>(
      `/notifications/${notificationId}/read/`
    );
    return response.data;
  },

  async markAsUnread(
    notificationId: number
  ): Promise<GenericNotificationResponse> {
    const response = await api.patch<GenericNotificationResponse>(
      `/notifications/${notificationId}/unread/`
    );
    return response.data;
  },

  async markAllAsRead(): Promise<GenericNotificationResponse> {
    const response = await api.patch<GenericNotificationResponse>(
      "/notifications/mark-all-read/"
    );
    return response.data;
  },

  async remove(notificationId: number): Promise<GenericNotificationResponse> {
    const response = await api.delete<GenericNotificationResponse>(
      `/notifications/${notificationId}/`
    );
    return response.data;
  },

  async clearRead(): Promise<GenericNotificationResponse> {
    const response = await api.delete<GenericNotificationResponse>(
      "/notifications/clear-read/"
    );
    return response.data;
  },
};