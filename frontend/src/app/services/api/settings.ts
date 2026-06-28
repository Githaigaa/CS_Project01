import type {
  ApiUser,
  ChangePasswordPayload,
  NotificationPreferences,
  ProfileUpdatePayload,
} from "../../lib/api/types";
import { setStoredUser } from "../authStorage";
import { apiClient } from "./client";

export const EMAIL_PREFERENCE_KEYS = [
  "disease_alerts",
  "movement_approvals",
  "marketplace_offers",
  "transfer_requests",
  "payment_confirmations",
  "system_updates",
] as const;

export const SMS_PREFERENCE_KEYS = [
  "critical_health_alerts",
  "movement_approvals",
  "high_value_offers",
] as const;

export const EMAIL_PREFERENCE_LABELS: Record<(typeof EMAIL_PREFERENCE_KEYS)[number], string> = {
  disease_alerts: "Disease alerts",
  movement_approvals: "Movement approvals",
  marketplace_offers: "Marketplace offers",
  transfer_requests: "Transfer requests",
  payment_confirmations: "Payment confirmations",
  system_updates: "System updates",
};

export const SMS_PREFERENCE_LABELS: Record<(typeof SMS_PREFERENCE_KEYS)[number], string> = {
  critical_health_alerts: "Critical health alerts",
  movement_approvals: "Movement approvals",
  high_value_offers: "High-value offers",
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: {
    disease_alerts: true,
    movement_approvals: true,
    marketplace_offers: true,
    transfer_requests: true,
    payment_confirmations: true,
    system_updates: true,
  },
  sms: {
    critical_health_alerts: false,
    movement_approvals: false,
    high_value_offers: false,
  },
};

export function getUserInitials(user: Pick<ApiUser, "first_name" | "last_name" | "username">): string {
  const first = user.first_name?.trim()?.[0] ?? "";
  const last = user.last_name?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || user.username.slice(0, 2).toUpperCase();
}

export function normalizeNotificationPreferences(
  preferences?: NotificationPreferences | null,
): NotificationPreferences {
  return {
    email: { ...DEFAULT_NOTIFICATION_PREFERENCES.email, ...(preferences?.email ?? {}) },
    sms: { ...DEFAULT_NOTIFICATION_PREFERENCES.sms, ...(preferences?.sms ?? {}) },
  };
}

function persistUser(user: ApiUser): ApiUser {
  setStoredUser(user);
  return user;
}

export const settingsApi = {
  async getProfile(): Promise<ApiUser> {
    const { data } = await apiClient.get<ApiUser>("/auth/me/");
    return data;
  },

  async updateProfile(payload: ProfileUpdatePayload): Promise<ApiUser> {
    const { data } = await apiClient.patch<ApiUser>("/auth/me/", payload);
    return persistUser(data);
  },

  async uploadAvatar(file: File): Promise<ApiUser> {
    const formData = new FormData();
    formData.append("profile_photo", file);
    const { data } = await apiClient.patch<ApiUser>("/auth/me/avatar/", formData);
    return persistUser(data);
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const { data } = await apiClient.get<NotificationPreferences>("/auth/me/preferences/");
    return normalizeNotificationPreferences(data);
  },

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<ApiUser> {
    const { data } = await apiClient.patch<ApiUser>("/auth/me/preferences/", preferences);
    return persistUser(data);
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiClient.post("/auth/change-password/", payload);
  },
};
