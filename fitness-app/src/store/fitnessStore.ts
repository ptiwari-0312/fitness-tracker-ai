/**
 * UI-level fitness state: selected date, quick-add flows, notification prefs.
 * Server state (workouts, meals, etc.) lives in React Query cache, not here.
 */
import { format } from "date-fns";
import { create } from "zustand";

interface FitnessState {
  selectedDate: string;   // YYYY-MM-DD
  waterGoalMl: number;
  calorieGoal: number;

  setSelectedDate: (date: string) => void;
  setToday: () => void;
  setWaterGoal: (ml: number) => void;
  setCalorieGoal: (kcal: number) => void;
}

export const useFitnessStore = create<FitnessState>((set) => ({
  selectedDate: format(new Date(), "yyyy-MM-dd"),
  waterGoalMl: 2500,
  calorieGoal: 2000,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setToday: () => set({ selectedDate: format(new Date(), "yyyy-MM-dd") }),
  setWaterGoal: (ml) => set({ waterGoalMl: ml }),
  setCalorieGoal: (kcal) => set({ calorieGoal: kcal }),
}));
