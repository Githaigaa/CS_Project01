import type { PaginatedResponse } from "./animals";

export type ApiNotificationType =
  | "health_due"
  | "vaccination_due"
  | "movement_approved"
  | "movement_rejected"
  | "listing_inquiry"
  | "listing_sold"
  | "disease_alert"
  | "system";

export interface ApiNotification {
  id: number;
  notification_type: ApiNotificationType;
  title: string;
  message: string;
  is_read: boolean;
  action_required: boolean;
  related_animal: number | null;
  related_listing: number | null;
  created_at: string;
}

export interface NotificationUnreadCount {
  count: number;
  action_required_count: number;
  disease_alerts_count: number;
  pending_approvals_count: number;
}

export type NotificationFilter = "all" | "unread" | "action_required";

export interface NotificationListParams {
  page?: number;
  pageSize?: number;
  filter?: NotificationFilter;
  ordering?: "created_at" | "-created_at";
}

export type NotificationListResponse = PaginatedResponse<ApiNotification> | ApiNotification[];

export type UiNotificationType = "alert" | "approval" | "offer" | "transfer" | "info";

export interface UiNotification {
  id: string;
  type: UiNotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
}

function mapNotificationType(apiType: ApiNotificationType): UiNotificationType {
  switch (apiType) {
    case "disease_alert":
      return "alert";
    case "movement_approved":
    case "movement_rejected":
      return "approval";
    case "listing_inquiry":
      return "offer";
    case "listing_sold":
      return "transfer";
    default:
      return "info";
  }
}

export function mapApiNotificationToUi(notification: ApiNotification): UiNotification {
  return {
    id: String(notification.id),
    type: mapNotificationType(notification.notification_type),
    title: notification.title,
    message: notification.message,
    timestamp: notification.created_at,
    read: notification.is_read,
    actionRequired: notification.action_required,
  };
}

export function filterToQueryParams(filter: NotificationFilter = "all"): {
  is_read?: string;
  action_required?: string;
} {
  switch (filter) {
    case "unread":
      return { is_read: "false" };
    case "action_required":
      return { action_required: "true", is_read: "false" };
    default:
      return {};
  }
}
