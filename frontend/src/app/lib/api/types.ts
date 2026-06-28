/** API response types aligned with Django REST Framework serializers. */

export type ApiUserRole =
  | "farmer"
  | "vet"
  | "inspector"
  | "buyer"
  | "abattoir"
  | "admin";

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: ApiUserRole;
  role_display: string;
  phone_number: string;
  national_id: string | null;
  location: string;
  bio?: string;
  profile_photo?: string | null;
  notification_preferences?: NotificationPreferences;
  is_verified: boolean;
  date_joined: string;
}

export interface NotificationPreferences {
  email: Record<string, boolean>;
  sms: Record<string, boolean>;
}

export interface ProfileUpdatePayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  national_id?: string | null;
  location?: string;
  bio?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface TokenPairResponse {
  access: string;
  refresh: string;
  user: ApiUser;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: ApiUserRole;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  national_id?: string;
  location?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}
