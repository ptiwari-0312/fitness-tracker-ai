/**
 * Axios instance with auth interceptors.
 * Automatically attaches Bearer token and retries once with a refreshed token on 401.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/store/authStore";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — inject access token ─────────────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — refresh on 401 ────────────────────────────────
let _refreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthEndpoint = original.url?.includes("/auth/");
    if (error.response?.status === 401 && !original._retry && !_refreshing && !isAuthEndpoint) {
      original._retry = true;
      _refreshing = true;

      try {
        const refresh = useAuthStore.getState().refreshToken;
        if (!refresh) throw new Error("No refresh token");

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh });
        useAuthStore.getState().setTokens(data.access_token, data.refresh_token);

        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      } finally {
        _refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Convenience helpers
export const get = <T>(url: string, params?: object) =>
  api.get<T>(url, { params }).then((r) => r.data);

export const post = <T>(url: string, body?: object, timeoutMs?: number) =>
  api.post<T>(url, body, timeoutMs ? { timeout: timeoutMs } : undefined).then((r) => r.data);

export const patch = <T>(url: string, body?: object) =>
  api.patch<T>(url, body).then((r) => r.data);

export const del = (url: string) => api.delete(url).then((r) => r.data);
