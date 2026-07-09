import { get, post } from "./api";

export interface ChatResponse {
  session_id: string;
  message: string;
  provider: string;
  model: string;
  suggestions?: string[];
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  weight_trend?: string;
  weight_change_kg?: number;
  workout_sessions: number;
  workout_goal_met: boolean;
  avg_daily_water_ml: number;
  avg_daily_calories: number;
  habit_completion_rate: number;
  recommendations: string[];
  motivational_message: string;
}

export const aiService = {
  newSession: () => post<{ session_id: string }>("/ai/chat/new-session"),

  chat: (session_id: string, message: string) =>
    post<ChatResponse>("/ai/chat", { session_id, message }, 180_000),

  weeklySummary: () => get<WeeklySummary>("/ai/weekly-summary"),
};
