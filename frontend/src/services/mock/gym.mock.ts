import type {
  CyclicalWorkoutSplit,
  CycleConfig,
  ProteinIntake,
  LoggedFoodItem,
  CompletedWorkouts,
  Habit,
} from '@/types';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// Default workout split (Push/Pull/Legs/Rest)
const initialWorkoutSplit: CyclicalWorkoutSplit = {
  'Day 1': {
    title: 'Push Day',
    exercises: [
      { id: 'ex-1', name: 'Bench Press', sets: '4x8', kValue: 1.5, baselineWeight: 60, baselineReps: 8, targetWeight: 80, targetReps: 8, sessionHistory: [] },
      { id: 'ex-2', name: 'Overhead Press', sets: '3x10', kValue: 1.5, baselineWeight: 30, baselineReps: 10, targetWeight: 45, targetReps: 10, sessionHistory: [] },
      { id: 'ex-3', name: 'Incline Dumbbell Press', sets: '3x12', sessionHistory: [] },
      { id: 'ex-4', name: 'Lateral Raises', sets: '3x15', sessionHistory: [] },
      { id: 'ex-5', name: 'Tricep Pushdowns', sets: '3x12', sessionHistory: [] },
    ],
  },
  'Day 2': {
    title: 'Pull Day',
    exercises: [
      { id: 'ex-6', name: 'Deadlift', sets: '4x6', kValue: 2.0, baselineWeight: 80, baselineReps: 6, targetWeight: 120, targetReps: 6, sessionHistory: [] },
      { id: 'ex-7', name: 'Barbell Row', sets: '4x8', sessionHistory: [] },
      { id: 'ex-8', name: 'Pull-ups', sets: '3x8', sessionHistory: [] },
      { id: 'ex-9', name: 'Face Pulls', sets: '3x15', sessionHistory: [] },
      { id: 'ex-10', name: 'Barbell Curls', sets: '3x12', sessionHistory: [] },
    ],
  },
  'Day 3': {
    title: 'Leg Day',
    exercises: [
      { id: 'ex-11', name: 'Squats', sets: '4x8', kValue: 2.0, baselineWeight: 70, baselineReps: 8, targetWeight: 100, targetReps: 8, sessionHistory: [] },
      { id: 'ex-12', name: 'Romanian Deadlift', sets: '3x10', sessionHistory: [] },
      { id: 'ex-13', name: 'Leg Press', sets: '3x12', sessionHistory: [] },
      { id: 'ex-14', name: 'Leg Curls', sets: '3x12', sessionHistory: [] },
      { id: 'ex-15', name: 'Calf Raises', sets: '4x15', sessionHistory: [] },
    ],
  },
  'Day 4': {
    title: 'Rest Day',
    exercises: [],
  },
};

let mockWorkoutSplit: CyclicalWorkoutSplit = { ...initialWorkoutSplit };
let mockCycleConfig: CycleConfig = {
  startDate: new Date().toISOString().split('T')[0],
  startDayKey: 'Day 1',
};
let mockProteinIntakes: ProteinIntake[] = [];
let mockFoodLog: LoggedFoodItem[] = [];
let mockCompletedWorkouts: CompletedWorkouts = {};
let mockCustomFoods: string[] = ['Chicken Breast', 'Whey Protein', 'Eggs', 'Paneer', 'Greek Yogurt', 'Tofu'];
let mockHabits: Habit[] = [];
let mockProteinTarget = 150;

export const gymMockService = {
  // Workout Split
  async getWorkoutSplit(): Promise<CyclicalWorkoutSplit> {
    await delay();
    return { ...mockWorkoutSplit };
  },

  async updateWorkoutSplit(split: CyclicalWorkoutSplit): Promise<CyclicalWorkoutSplit> {
    await delay();
    mockWorkoutSplit = { ...split };
    return mockWorkoutSplit;
  },

  // Cycle Config
  async getCycleConfig(): Promise<CycleConfig> {
    await delay();
    return { ...mockCycleConfig };
  },

  async updateCycleConfig(config: CycleConfig): Promise<CycleConfig> {
    await delay();
    mockCycleConfig = { ...config };
    return mockCycleConfig;
  },

  // Protein Intakes
  async getProteinIntakes(): Promise<ProteinIntake[]> {
    await delay();
    return [...mockProteinIntakes];
  },

  async addProteinIntake(intake: Omit<ProteinIntake, 'id'>): Promise<ProteinIntake> {
    await delay();
    const newIntake: ProteinIntake = { ...intake, id: `protein-${Date.now()}` };
    mockProteinIntakes = [newIntake, ...mockProteinIntakes];
    return newIntake;
  },

  async deleteProteinIntake(id: string): Promise<void> {
    await delay();
    mockProteinIntakes = mockProteinIntakes.filter((p) => p.id !== id);
  },

  // Food Log
  async getFoodLog(): Promise<LoggedFoodItem[]> {
    await delay();
    return [...mockFoodLog];
  },

  async addFoodItem(item: Omit<LoggedFoodItem, 'id'>): Promise<LoggedFoodItem> {
    await delay();
    const newItem: LoggedFoodItem = { ...item, id: `food-${Date.now()}` };
    mockFoodLog = [newItem, ...mockFoodLog];
    return newItem;
  },

  async deleteFoodItem(id: string): Promise<void> {
    await delay();
    mockFoodLog = mockFoodLog.filter((f) => f.id !== id);
  },

  // Completed Workouts
  async getCompletedWorkouts(): Promise<CompletedWorkouts> {
    await delay();
    return { ...mockCompletedWorkouts };
  },

  async toggleWorkoutCompletion(
    date: string,
    completed: boolean,
  ): Promise<CompletedWorkouts> {
    await delay();
    mockCompletedWorkouts = { ...mockCompletedWorkouts, [date]: completed };
    return mockCompletedWorkouts;
  },

  // Custom Foods
  async getCustomFoods(): Promise<string[]> {
    await delay();
    return [...mockCustomFoods];
  },

  async updateCustomFoods(foods: string[]): Promise<string[]> {
    await delay();
    mockCustomFoods = [...foods];
    return mockCustomFoods;
  },

  // Gym-related habits (e.g. water intake shown on gym page)
  async getGymHabits(): Promise<Habit[]> {
    await delay();
    return [...mockHabits];
  },

  // Protein target
  async getProteinTarget(): Promise<number> {
    await delay();
    return mockProteinTarget;
  },

  async updateProteinTarget(target: number): Promise<number> {
    await delay();
    mockProteinTarget = target;
    return mockProteinTarget;
  },
};
