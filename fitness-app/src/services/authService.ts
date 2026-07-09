import { get, post } from "./api";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  target_weight_kg?: number;
  goal?: string;
  streak_days: number;
  total_points: number;
  created_at: string;
}

export const authService = {
  register: (data: RegisterPayload) => post<TokenResponse>("/auth/register", data),
  login: (data: LoginPayload) => post<TokenResponse>("/auth/login", data),
  refresh: (refresh_token: string) => post<TokenResponse>("/auth/refresh", { refresh_token }),
  getMe: () => get<UserProfile>("/auth/me"),
};
