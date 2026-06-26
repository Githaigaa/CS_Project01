import type {
  ApiNotification,
  NotificationListParams,
  NotificationListResponse,
  NotificationUnreadCount,
} from "../../lib/api/notifications";
import { filterToQueryParams } from "../../lib/api/notifications";
import type { PaginatedResponse } from "../../lib/api/animals";
import { apiClient } from "./client";

function normalizeListResponse(data: NotificationListResponse): PaginatedResponse<ApiNotification> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data,
    };
  }

  return data;
}

export const notificationsApi = {
  async listNotifications(
    params: NotificationListParams = {},
  ): Promise<PaginatedResponse<ApiNotification>> {
    const filterParams = filterToQueryParams(params.filter);
    const { data } = await apiClient.get<NotificationListResponse>("/notifications/", {
      params: {
        page: params.page,
        page_size: params.pageSize,
        ordering: params.ordering ?? "-created_at",
        ...filterParams,
      },
    });
    return normalizeListResponse(data);
  },

  async getUnreadCount(): Promise<NotificationUnreadCount> {
    const { data } = await apiClient.get<NotificationUnreadCount>("/notifications/unread-count/");
    return data;
  },

  async markAsRead(id: number | string): Promise<ApiNotification> {
    const { data } = await apiClient.patch<ApiNotification>(`/notifications/${id}/`, {
      is_read: true,
    });
    return data;
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    const { data } = await apiClient.post<{ updated: number }>("/notifications/mark-all-read/");
    return data;
  },

  async deleteNotification(id: number | string): Promise<void> {
    await apiClient.delete(`/notifications/${id}/`);
  },
};
