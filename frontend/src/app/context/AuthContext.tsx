import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ApiUser, LoginPayload, RegisterPayload } from "../lib/api/types";
import { authApi } from "../services/api/auth";
import {
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  setStoredUser,
} from "../services/authStorage";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: ApiUser | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      const token = getAccessToken();
      const cachedUser = getStoredUser();

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
        return;
      }

      if (cachedUser && !cancelled) {
        setUser(cachedUser);
        setStatus("authenticated");
      }

      try {
        const profile = await authApi.me();
        if (!cancelled) {
          setStoredUser(profile);
          setUser(profile);
          setStatus("authenticated");
        }
      } catch {
        clearAuthSession();
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await authApi.login(payload);
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await authApi.register(payload);
    const data = await authApi.login({
      username: payload.username,
      password: payload.password,
    });
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      isAuthenticated: status === "authenticated",
      login,
      register,
      logout,
    }),
    [status, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
