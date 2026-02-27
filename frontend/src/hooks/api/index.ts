/**
 * API Hooks Barrel Export
 *
 * Centralized re-export of all data-fetching hooks so pages can import like:
 *   import { useTodos, useHabits } from '@/hooks/api';
 */

export { useTodos } from './use-todos';
export { useTransactions } from './use-transactions';
export { useHabits } from './use-habits';
export { useNotes } from './use-notes';
export { useCredentials } from './use-credentials';
export { useNotifications } from './use-notifications';
export { useGoals } from './use-goals';
export { usePlanner } from './use-planner';
export { useGym } from './use-gym';
export { usePreferences } from './use-preferences';
export { useAiChat } from './use-ai-chat';
export { usePush } from './use-push';
export {
  useAdminUsers,
  useAdminAiConfig,
  useAdminSystemSettings,
  useAdminAnnouncements,
  useAdminAbout,
} from './use-admin';
