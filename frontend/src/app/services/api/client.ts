import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAuthSession,
  setStoredUser,
} from "../authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearAuthSession();
    return null;
  }

  try {
    const { data } = await axios.post<{ access: string }>(
      `${API_BASE_URL}/auth/token/refresh/`,
      { refresh },
      { headers: { Accept: "application/json", "Content-Type": "application/json" } },
    );
    const access = data.access;
    const user = getStoredUser();
    const refreshToken = getRefreshToken();
    if (user && refreshToken) {
      setAuthSession(access, refreshToken, user);
    } else {
      localStorage.setItem("cattletrace_access_token", access);
    }
    return access;
  } catch {
    clearAuthSession();
    return null;
  }
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/token/") ||
      originalRequest?.url?.includes("/auth/register/");

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccess = await refreshPromise;
    if (!newAccess) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
    return apiClient(originalRequest);
  },
);

export async function syncStoredUserFromApi(): Promise<void> {
  const { data } = await apiClient.get("/auth/me/");
  setStoredUser(data);
}
