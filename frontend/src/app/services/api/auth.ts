import type {
  ApiUser,
  LoginPayload,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  PasswordResetVerifyOtpPayload,
  RegisterPayload,
  TokenPairResponse,
} from "../../lib/api/types";
import { setAuthSession } from "../authStorage";
import { apiClient } from "./client";

export const authApi = {
  async login(payload: LoginPayload): Promise<TokenPairResponse> {
    const { data } = await apiClient.post<TokenPairResponse>("/auth/token/", payload);
    setAuthSession(data.access, data.refresh, data.user);
    return data;
  },

  async register(payload: RegisterPayload): Promise<ApiUser> {
    const { data } = await apiClient.post<ApiUser>("/auth/register/", payload);
    return data;
  },

  async me(): Promise<ApiUser> {
    const { data } = await apiClient.get<ApiUser>("/auth/me/");
    return data;
  },

  async refresh(refresh: string): Promise<{ access: string }> {
    const { data } = await apiClient.post<{ access: string }>("/auth/token/refresh/", {
      refresh,
    });
    return data;
  },

  async requestPasswordReset(payload: PasswordResetRequestPayload): Promise<{ detail: string }> {
    const { data } = await apiClient.post<{ detail: string }>("/auth/password-reset/", payload);
    return data;
  },

  async verifyPasswordResetOtp(payload: PasswordResetVerifyOtpPayload): Promise<{ reset_token: string }> {
    const { data } = await apiClient.post<{ reset_token: string }>("/auth/password-reset/verify-otp/", payload);
    return data;
  },

  async confirmPasswordReset(payload: PasswordResetConfirmPayload): Promise<{ detail: string }> {
    const { data } = await apiClient.post<{ detail: string }>("/auth/password-reset/confirm/", payload);
    return data;
  },
};
