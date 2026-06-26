// Example utility for triggering notifications from anywhere in the app

import { auth } from './firebase';

export async function sendNotification(
  endpoint: string,
  data: Record<string, unknown>
) {
  if (!auth) return;

  const user = auth.currentUser;
  if (!user) return;

  const token = await user.getIdToken();
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    console.error('Failed to send notification:', await response.text());
  }

  return response.json();
}

// Usage examples:

// When marking a habit as complete (in habits/page.tsx)
export async function notifyHabitReminder(habitName: string, habitId: string) {
  return sendNotification('/notifications/habit-reminder', {
    habitName,
    habitId,
  });
}

// When budget threshold is crossed (in expenses/page.tsx)
export async function notifyBudgetAlert(spent: number, budget: number) {
  return sendNotification('/notifications/budget-alert', {
    message: `You've spent ${((spent/budget)*100).toFixed(0)}% of your budget`,
    spent,
    budget,
  });
}

// When water intake is low (in dashboard/page.tsx)
export async function notifyWaterReminder(glassesConsumed: number, targetGlasses: number) {
  return sendNotification('/notifications/water-reminder', {
    glassesConsumed,
    targetGlasses,
  });
}

// When todo deadline is approaching
export async function notifyTodoReminder(todoId: string, todoText: string) {
  return sendNotification('/notifications/todo-reminder', {
    todoId,
    todoText,
  });
}
