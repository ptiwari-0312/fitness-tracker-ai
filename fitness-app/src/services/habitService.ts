import { get, post, patch, del } from "./api";

export interface Habit {
  id: string;
  name: string;
  habit_type: string;
  target_value?: number;
  unit?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  streak: number;
  best_streak: number;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  log_date: string;
  is_completed: boolean;
  value?: number;
  notes?: string;
}

export interface DailyHabitSummary {
  log_date: string;
  total_habits: number;
  completed: number;
  completion_rate: number;
  habits: Array<{ habit: Habit; log?: HabitLog }>;
}

export const habitService = {
  list: () => get<Habit[]>("/habits/"),
  create: (data: { name: string; habit_type?: string; icon?: string; color?: string }) =>
    post<Habit>("/habits/", data),
  update: (id: string, data: Partial<Habit>) => patch<Habit>(`/habits/${id}`, data),
  delete: (id: string) => del(`/habits/${id}`),
  logHabit: (habitId: string, log_date: string, is_completed: boolean) =>
    post<HabitLog>(`/habits/${habitId}/log`, { log_date, is_completed }),
  getDailySummary: (date: string) =>
    get<DailyHabitSummary>(`/habits/summary?date=${date}`),
};
