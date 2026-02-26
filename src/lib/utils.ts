import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { subDays, format, isSameDay } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateStreak = (completions: Record<string, boolean | number>, target = 1): number => {
    let streak = 0;
    let currentDay = new Date();

    const isCompletedOnDate = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const completion = completions[dateKey];

        if (typeof completion === 'boolean') {
            return completion;
        }
        if (typeof completion === 'number') {
            return completion >= target;
        }
        return false;
    }
    
    // If today is not completed, start checking from yesterday for the streak.
    if (!isCompletedOnDate(currentDay)) {
        currentDay = subDays(currentDay, 1);
    }
    
    // Now, from `currentDay` (which could be the actual today or yesterday), count backwards.
    for (let i = 0; i < 365 * 5; i++) { // Check for up to 5 years for long streaks
        const dayToCheck = subDays(currentDay, i);
        if (isCompletedOnDate(dayToCheck)) {
            streak++;
        } else {
            // As soon as we find a day that is not completed, the streak is broken.
            break;
        }
    }
    
    return streak;
};
