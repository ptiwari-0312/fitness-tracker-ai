/**
 * Collection of React Query hooks for all fitness domains.
 * Co-locating them prevents query-key typo bugs across the app.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { mealService } from "@/services/mealService";
import { waterService } from "@/services/waterService";
import { weightService } from "@/services/weightService";
import { workoutService } from "@/services/workoutService";
import { aiService } from "@/services/aiService";

const today = () => format(new Date(), "yyyy-MM-dd");

// ── Weight ────────────────────────────────────────────────────────────────────
export function useWeightProgress() {
  return useQuery({
    queryKey: ["weight", "progress"],
    queryFn: weightService.getProgress,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ weight_kg, log_date }: { weight_kg: number; log_date: string }) =>
      weightService.log(weight_kg, log_date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weight"] }),
  });
}

// ── Water ─────────────────────────────────────────────────────────────────────
export function useDailyWater(date = today()) {
  return useQuery({
    queryKey: ["water", "summary", date],
    queryFn: () => waterService.getSummary(date),
    staleTime: 60 * 1000,
  });
}

export function useAddWater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ amount_ml, date }: { amount_ml: number; date?: string }) =>
      waterService.add(amount_ml, date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water"] }),
  });
}

// ── Meals ─────────────────────────────────────────────────────────────────────
export function useDailyNutrition(date = today()) {
  return useQuery({
    queryKey: ["meals", "summary", date],
    queryFn: () => mealService.getDailySummary(date),
    staleTime: 60 * 1000,
  });
}

export function useDailyMealLogs(date = today()) {
  return useQuery({
    queryKey: ["meals", "logs", date],
    queryFn: () => mealService.getDailyLogs(date),
    staleTime: 60 * 1000,
  });
}

export function useLogMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mealService.logMeal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meals"] }),
  });
}

// ── Workouts ──────────────────────────────────────────────────────────────────
export function useStartWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, duration_minutes, calories_burned, log_date, sets, exercise_id }: {
      name: string; duration_minutes?: number; calories_burned?: number;
      log_date?: string; sets?: { reps: number; weight_kg?: number }[]; exercise_id?: string;
    }) => {
      const log = await workoutService.startWorkout(name, undefined, log_date);
      if (sets && sets.length > 0) {
        for (let i = 0; i < sets.length; i++) {
          await workoutService.addSet(log.id, {
            set_number: i + 1,
            reps: sets[i].reps,
            weight_kg: sets[i].weight_kg,
            exercise_id,
            exercise_name: name,
          } as any);
        }
      }
      return workoutService.completeWorkout(log.id, {
        is_completed: true,
        duration_minutes,
        calories_burned,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });
}

export function useWorkoutLogs(date?: string) {
  return useQuery({
    queryKey: ["workouts", "logs", date],
    queryFn: () => workoutService.getLogs(1, date),
    staleTime: 2 * 60 * 1000,
  });
}

export function useExercises(search?: string, category?: string) {
  return useQuery({
    queryKey: ["exercises", search, category],
    queryFn: () => workoutService.listExercises(search, category),
    staleTime: 10 * 60 * 1000,
  });
}

// ── AI ────────────────────────────────────────────────────────────────────────
export function useWeeklySummary() {
  return useQuery({
    queryKey: ["ai", "weekly-summary"],
    queryFn: aiService.weeklySummary,
    staleTime: 60 * 60 * 1000,  // cache 1hr — expensive AI call
  });
}
