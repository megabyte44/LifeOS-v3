import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gymService } from '@/services';
import type {
  CyclicalWorkoutSplit,
  CycleConfig,
  ProteinIntake,
  LoggedFoodItem,
} from '@/types';
import { useAuth } from '@/hooks/use-auth';

// Query keys
const KEYS = {
  workoutSplit: ['gym', 'workout-split'] as const,
  cycleConfig: ['gym', 'cycle-config'] as const,
  proteinIntakes: ['gym', 'protein-intakes'] as const,
  foodLog: ['gym', 'food-log'] as const,
  completedWorkouts: ['gym', 'completions'] as const,
  customFoods: ['gym', 'custom-foods'] as const,
  gymHabits: ['gym', 'habits'] as const,
  proteinTarget: ['gym', 'protein-target'] as const,
};

export function useGym() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const enabled = !!user;

  // ---- Queries ----
  const workoutSplitQuery = useQuery({
    queryKey: KEYS.workoutSplit,
    queryFn: () => gymService.getWorkoutSplit(),
    enabled,
  });

  const cycleConfigQuery = useQuery({
    queryKey: KEYS.cycleConfig,
    queryFn: () => gymService.getCycleConfig(),
    enabled,
  });

  const proteinIntakesQuery = useQuery({
    queryKey: KEYS.proteinIntakes,
    queryFn: () => gymService.getProteinIntakes(),
    enabled,
  });

  const foodLogQuery = useQuery({
    queryKey: KEYS.foodLog,
    queryFn: () => gymService.getFoodLog(),
    enabled,
  });

  const completedWorkoutsQuery = useQuery({
    queryKey: KEYS.completedWorkouts,
    queryFn: () => gymService.getCompletedWorkouts(),
    enabled,
  });

  const customFoodsQuery = useQuery({
    queryKey: KEYS.customFoods,
    queryFn: () => gymService.getCustomFoods(),
    enabled,
  });

  const gymHabitsQuery = useQuery({
    queryKey: KEYS.gymHabits,
    queryFn: () => gymService.getGymHabits(),
    enabled,
  });

  const proteinTargetQuery = useQuery({
    queryKey: KEYS.proteinTarget,
    queryFn: () => gymService.getProteinTarget(),
    enabled,
  });

  // ---- Mutations ----
  const updateWorkoutSplit = useMutation({
    mutationFn: (split: CyclicalWorkoutSplit) => gymService.updateWorkoutSplit(split),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.workoutSplit }),
  });

  const updateCycleConfig = useMutation({
    mutationFn: (config: CycleConfig) => gymService.updateCycleConfig(config),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.cycleConfig }),
  });

  const addProteinIntake = useMutation({
    mutationFn: (intake: Omit<ProteinIntake, 'id'>) => gymService.addProteinIntake(intake),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.proteinIntakes }),
  });

  const deleteProteinIntake = useMutation({
    mutationFn: (id: string) => gymService.deleteProteinIntake(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.proteinIntakes }),
  });

  const addFoodItem = useMutation({
    mutationFn: (item: Omit<LoggedFoodItem, 'id'>) => gymService.addFoodItem(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.foodLog }),
  });

  const deleteFoodItem = useMutation({
    mutationFn: (id: string) => gymService.deleteFoodItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.foodLog }),
  });

  const toggleWorkoutCompletion = useMutation({
    mutationFn: ({ date, completed }: { date: string; completed: boolean }) =>
      gymService.toggleWorkoutCompletion(date, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.completedWorkouts }),
  });

  const updateCustomFoods = useMutation({
    mutationFn: (foods: string[]) => gymService.updateCustomFoods(foods),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.customFoods }),
  });

  const updateProteinTarget = useMutation({
    mutationFn: (target: number) => gymService.updateProteinTarget(target),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.proteinTarget }),
  });

  // Aggregate loading state
  const isLoading =
    workoutSplitQuery.isLoading ||
    cycleConfigQuery.isLoading ||
    proteinIntakesQuery.isLoading ||
    foodLogQuery.isLoading ||
    completedWorkoutsQuery.isLoading ||
    customFoodsQuery.isLoading;

  return {
    // Data
    workoutSplit: workoutSplitQuery.data ?? ({} as CyclicalWorkoutSplit),
    cycleConfig: cycleConfigQuery.data ?? { startDate: new Date().toISOString().split('T')[0], startDayKey: 'Day 1' },
    proteinIntakes: proteinIntakesQuery.data ?? [],
    loggedFoodItems: foodLogQuery.data ?? [],
    completedWorkouts: completedWorkoutsQuery.data ?? {},
    customFoodItems: customFoodsQuery.data ?? [],
    gymHabits: gymHabitsQuery.data ?? [],
    proteinTarget: proteinTargetQuery.data ?? 150,

    // Loading
    isLoading,

    // Mutations
    updateWorkoutSplit: updateWorkoutSplit.mutateAsync,
    updateCycleConfig: updateCycleConfig.mutateAsync,
    addProteinIntake: addProteinIntake.mutateAsync,
    deleteProteinIntake: deleteProteinIntake.mutateAsync,
    addFoodItem: addFoodItem.mutateAsync,
    deleteFoodItem: deleteFoodItem.mutateAsync,
    toggleWorkoutCompletion: toggleWorkoutCompletion.mutateAsync,
    updateCustomFoods: updateCustomFoods.mutateAsync,
    updateProteinTarget: updateProteinTarget.mutateAsync,

    // Refetch helpers
    refetchAll: () => {
      queryClient.invalidateQueries({ queryKey: ['gym'] });
    },
  };
}
