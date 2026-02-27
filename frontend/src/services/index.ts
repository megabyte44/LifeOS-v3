/**
 * Service Resolver
 *
 * Selects between mock and real API service implementations based on the
 * NEXT_PUBLIC_USE_MOCK_API environment variable.
 *
 * Usage:
 *   import { todoService, habitService } from '@/services';
 *   const todos = await todoService.getAll();
 */

import { IS_MOCK } from '@/lib/api-client';

// ---------- Mock services ----------
import { todoMockService } from './mock/todo.mock';
import { transactionMockService } from './mock/transaction.mock';
import { habitMockService } from './mock/habit.mock';
import { noteMockService } from './mock/note.mock';
import { credentialMockService } from './mock/credential.mock';
import { notificationMockService } from './mock/notification.mock';
import { goalMockService } from './mock/goal.mock';
import { plannerMockService } from './mock/planner.mock';
import { gymMockService } from './mock/gym.mock';
import { preferenceMockService } from './mock/preference.mock';
import { aiChatMockService } from './mock/ai-chat.mock';
import { pushMockService } from './mock/push.mock';
import { adminMockService } from './mock/admin.mock';
import { userMockService } from './mock/user.mock';

// ---------- Real API services ----------
import { todoApiService } from './todo.service';
import { transactionApiService } from './transaction.service';
import { habitApiService } from './habit.service';
import { noteApiService } from './note.service';
import { credentialApiService } from './credential.service';
import { notificationApiService } from './notification.service';
import { goalApiService } from './goal.service';
import { plannerApiService } from './planner.service';
import { gymApiService } from './gym.service';
import { preferenceApiService } from './preference.service';
import { aiChatApiService } from './ai-chat.service';
import { pushApiService } from './push.service';
import { adminApiService } from './admin.service';
import { userApiService } from './user.service';

// ---------- Resolved exports ----------

export const todoService       = IS_MOCK ? todoMockService       : todoApiService;
export const transactionService = IS_MOCK ? transactionMockService : transactionApiService;
export const habitService      = IS_MOCK ? habitMockService      : habitApiService;
export const noteService       = IS_MOCK ? noteMockService       : noteApiService;
export const credentialService = IS_MOCK ? credentialMockService : credentialApiService;
export const notificationService = IS_MOCK ? notificationMockService : notificationApiService;
export const goalService       = IS_MOCK ? goalMockService       : goalApiService;
export const plannerService    = IS_MOCK ? plannerMockService    : plannerApiService;
export const gymService        = IS_MOCK ? gymMockService        : gymApiService;
export const preferenceService = IS_MOCK ? preferenceMockService : preferenceApiService;
export const aiChatService     = IS_MOCK ? aiChatMockService     : aiChatApiService;
export const pushService       = IS_MOCK ? pushMockService       : pushApiService;
export const adminService      = IS_MOCK ? adminMockService      : adminApiService;
export const userService       = IS_MOCK ? userMockService       : userApiService;

// ---------- Re-export types ----------
export type { AiChatRequest, AiChatResponse } from './mock/ai-chat.mock';
export type { PushSubscribeRequest } from './mock/push.mock';
export type { UserProfile } from './mock/user.mock';
