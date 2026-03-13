import { apiClient } from '@/lib/api-client';
import type {
  CyclicalWorkoutSplit,
  CycleConfig,
  ProteinIntake,
  LoggedFoodItem,
  CompletedWorkouts,
  Habit,
} from '@/types';

export const gymApiService = {
  // Workout Split
  async getWorkoutSplit(): Promise<CyclicalWorkoutSplit> {
    return apiClient.get<CyclicalWorkoutSplit>('/gym/workout-split');
  },

  async updateWorkoutSplit(split: CyclicalWorkoutSplit): Promise<CyclicalWorkoutSplit> {
    return apiClient.put<CyclicalWorkoutSplit>('/gym/workout-split', split);
  },

  // Cycle Config
  async getCycleConfig(): Promise<CycleConfig> {
    return apiClient.get<CycleConfig>('/gym/cycle-config');
  },

  async updateCycleConfig(config: CycleConfig): Promise<CycleConfig> {
    return apiClient.put<CycleConfig>('/gym/cycle-config', config);
  },

  // Protein Intakes
  async getProteinIntakes(): Promise<ProteinIntake[]> {
    return apiClient.get<ProteinIntake[]>('/gym/protein-intakes');
  },

  async addProteinIntake(intake: Omit<ProteinIntake, 'id'>): Promise<ProteinIntake> {
    return apiClient.post<ProteinIntake>('/gym/protein-intakes', intake);
  },

  async deleteProteinIntake(id: string): Promise<void> {
    return apiClient.delete(`/gym/protein-intakes/${id}`);
  },

  // Food Log
  async getFoodLog(): Promise<LoggedFoodItem[]> {
    return apiClient.get<LoggedFoodItem[]>('/gym/food-log');
  },

  async addFoodItem(item: Omit<LoggedFoodItem, 'id'>): Promise<LoggedFoodItem> {
    return apiClient.post<LoggedFoodItem>('/gym/food-log', item);
  },

  async deleteFoodItem(id: string): Promise<void> {
    return apiClient.delete(`/gym/food-log/${id}`);
  },

  // Completed Workouts
  async getCompletedWorkouts(): Promise<CompletedWorkouts> {
    return apiClient.get<CompletedWorkouts>('/gym/completions');
  },

  async toggleWorkoutCompletion(
    date: string,
    completed: boolean,
  ): Promise<CompletedWorkouts> {
    return apiClient.put<CompletedWorkouts>('/gym/completions', { date, completed });
  },

  // Custom Foods
  async getCustomFoods(): Promise<string[]> {
    return apiClient.get<string[]>('/gym/custom-foods');
  },

  async updateCustomFoods(foods: string[]): Promise<string[]> {
    return apiClient.put<string[]>('/gym/custom-foods', { foods });
  },

  // Gym-related habits
  async getGymHabits(): Promise<Habit[]> {
    return apiClient.get<Habit[]>('/habits?context=gym');
  },

  // Protein target
  async getProteinTarget(): Promise<number> {
    const res = await apiClient.get<{ target: number }>('/gym/protein-target');
    return res.target;
  },

  async updateProteinTarget(target: number): Promise<number> {
    const res = await apiClient.put<{ target: number }>('/gym/protein-target', { target });
    return res.target;
  },
};
