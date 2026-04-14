"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  username: string;
  fullName: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check auth status on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setAuthState({ user, isLoading: false, isAuthenticated: true });
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        setAuthState({ user: null, isLoading: false, isAuthenticated: false });
      }
    } else {
      setAuthState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    const response = await api.post<{ user: User; token: string }>("/auth/login", credentials);

    if (response.success && response.data) {
      localStorage.setItem("auth_token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setAuthState({
        user: response.data.user,
        isLoading: false,
        isAuthenticated: true,
      });
      return { success: true };
    }

    setAuthState((prev) => ({ ...prev, isLoading: false }));
    return { success: false, error: response.error };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    const response = await api.post<{ user: User; token: string }>("/auth/register", data);

    if (response.success && response.data) {
      localStorage.setItem("auth_token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setAuthState({
        user: response.data.user,
        isLoading: false,
        isAuthenticated: true,
      });
      return { success: true };
    }

    setAuthState((prev) => ({ ...prev, isLoading: false }));
    return { success: false, error: response.error };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setAuthState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
  };
}