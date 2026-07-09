import { del, get, patch, post } from "./api";

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups?: string;
  difficulty: string;
  equipment?: string;
  calories_per_minute?: number;
}

export interface WorkoutSet {
  id: string;
  exercise_id: string;
  set_number: number;
  reps?: number;
  weight_kg?: number;
  duration_seconds?: number;
  exercise?: Exercise;
}

export interface SetInput {
  reps: number;
  weight_kg?: number;
  exercise_id?: string;
  exercise_name?: string;
}

export interface WorkoutLog {
  id: string;
  name: string;
  plan_id?: string;
  duration_minutes?: number;
  calories_burned?: number;
  is_completed: boolean;
  sets: WorkoutSet[];
  created_at: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  duration_weeks?: number;
  days_per_week?: number;
  is_favorite: boolean;
}

export const workoutService = {
  listExercises: (search?: string, category?: string) =>
    get<Exercise[]>("/workouts/exercises", { search, category }),

  createPlan: (data: Partial<WorkoutPlan>) =>
    post<WorkoutPlan>("/workouts/plans", data),

  getPlans: () => get<WorkoutPlan[]>("/workouts/plans"),

  startWorkout: (name: string, planId?: string, log_date?: string) =>
    post<WorkoutLog>("/workouts/logs", { name, plan_id: planId, started_at: log_date }),

  getLogs: (page = 1, date?: string) =>
    get<WorkoutLog[]>("/workouts/logs", { page, ...(date ? { date } : {}) }),

  getLog: (id: string) => get<WorkoutLog>(`/workouts/logs/${id}`),

  completeWorkout: (id: string, data: Partial<WorkoutLog>) =>
    patch<WorkoutLog>(`/workouts/logs/${id}`, data),

  addSet: (logId: string, set: Partial<WorkoutSet>) =>
    post<WorkoutSet>(`/workouts/logs/${logId}/sets`, set),
};
