import { del, get, post } from "./api";

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface ImageAnalysisResult {
  items: FoodItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  description: string;
  confidence: "high" | "medium" | "low";
}

export interface Meal {
  id: string;
  name: string;
  brand?: string;
  serving_size_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealLog {
  id: string;
  meal_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  log_date: string;
  quantity: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal?: Meal;
}

export interface DailyNutrition {
  log_date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meal_count: number;
}

export const mealService = {
  search: (q: string) => get<Meal[]>("/meals/search", { q }),

  createMeal: (data: Partial<Meal>) => post<Meal>("/meals", data),

  logMeal: (data: {
    meal_id: string;
    meal_type: string;
    log_date: string;
    quantity: number;
  }) => post<MealLog>("/meals/logs", data),

  getDailyLogs: (date: string) =>
    get<MealLog[]>("/meals/logs", { date }),

  getDailySummary: (date: string) =>
    get<DailyNutrition>("/meals/summary", { date }),

  logFromText: (text: string, meal_type: string, log_date: string) =>
    post<MealLog>("/meals/log-from-text", { text, meal_type, log_date }, 90_000),

  analyzeImage: (
    image_base64: string,
    mime_type: string,
    meal_type: string,
    log_date: string,
  ) =>
    post<ImageAnalysisResult>(
      "/meals/analyze-image",
      { image_base64, mime_type, meal_type, log_date },
      60_000,
    ),

  logFromAnalysis: (
    analysis: ImageAnalysisResult,
    meal_type: string,
    log_date: string,
  ) =>
    post<MealLog>("/meals/log-from-analysis", {
      description: analysis.description,
      total_calories: analysis.total_calories,
      total_protein_g: analysis.total_protein_g,
      total_carbs_g: analysis.total_carbs_g,
      total_fat_g: analysis.total_fat_g,
      meal_type,
      log_date,
    }),

  deleteLog: (id: string) => del(`/meals/logs/${id}`),
};
