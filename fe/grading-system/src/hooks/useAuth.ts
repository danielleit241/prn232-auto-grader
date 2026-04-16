"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib";

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isAuthenticated: false,
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await api.post<{ user: User; token: string }>("/auth/login", credentials);

      if (response.status && response.data) {
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
      return { success: false, error: response.message };
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await api.post<{ user: User; token: string }>("/auth/register", data);

      if (response.status && response.data) {
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
      return { success: false, error: response.message };
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: error instanceof Error ? error.message : "Registration failed" };
    }
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