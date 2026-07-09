import { get, post } from "./api";

export interface WeightLog {
  id: string;
  log_date: string;
  weight_kg: number;
  body_fat_pct?: number;
  notes?: string;
}

export interface WeightProgress {
  logs: WeightLog[];
  starting_weight?: number;
  current_weight?: number;
  target_weight?: number;
  total_change?: number;
  bmi?: number;
}

export const weightService = {
  log: (weight_kg: number, log_date: string, body_fat_pct?: number) =>
    post<WeightLog>("/weight", { weight_kg, log_date, body_fat_pct }),

  getProgress: () => get<WeightProgress>("/weight/progress"),
};
