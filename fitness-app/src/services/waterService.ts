import { get, post } from "./api";
import { format } from "date-fns";

export interface WaterLog {
  id: string;
  log_date: string;
  amount_ml: number;
  logged_at: string;
}

export interface DailyWaterSummary {
  log_date: string;
  total_ml: number;
  goal_ml: number;
  percentage: number;
  entries: number;
}

export const waterService = {
  add: (amount_ml: number, date?: string) =>
    post<WaterLog>("/water", {
      amount_ml,
      log_date: date ?? format(new Date(), "yyyy-MM-dd"),
      logged_at: new Date().toISOString(),
    }),

  getEntries: (date: string) => get<WaterLog[]>("/water", { date }),

  getSummary: (date: string) => get<DailyWaterSummary>("/water/summary", { date }),
};
