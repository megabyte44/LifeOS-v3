import type { UserPreferences } from '@/types';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const defaultPreferences: UserPreferences = {
  features: {
    waterIntake: true,
    todaysPlan: true,
    financialSnapshot: true,
    todoList: true,
    habitStreaks: true,
    gymTracker: true,
    proteinIntake: true,
    foodSupplements: true,
    overloadTracker: true,
    gymProteinIntake: true,
    gymFoodSupplements: true,
    proteinIntakeWidget: true,
    supplementIntakeWidget: true,
  },
  onboarding: {
    completedDashboardTour: false,
    completedProfileTour: false,
    completedGymPreferences: false,
    skippedTours: false,
  },
};

let mockPreferences: UserPreferences = { ...defaultPreferences };

export const preferenceMockService = {
  async get(): Promise<UserPreferences> {
    await delay();
    return { ...mockPreferences };
  },

  async update(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    await delay();
    mockPreferences = {
      ...mockPreferences,
      ...updates,
      features: {
        ...mockPreferences.features,
        ...(updates.features ?? {}),
      },
      onboarding: {
        ...mockPreferences.onboarding,
        ...(updates.onboarding ?? {}),
      },
    } as UserPreferences;
    return { ...mockPreferences };
  },
};
