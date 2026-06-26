# API Contract — LifeOS Backend

> This document specifies every endpoint the backend must implement for the
> LifeOS frontend to be fully operational. Any backend (Express, FastAPI,
> Go, etc.) that conforms to this contract will work as a plug-and-play backend.

## Authentication

All endpoints (except those marked **public**) require a valid Firebase ID
token in the `Authorization` header:

```
Authorization: Bearer <firebase_id_token>
```

The backend must verify the token with Firebase Admin SDK and extract the
`uid` to scope all data operations to the authenticated user.

---

## Base URL

Configured via the `NEXT_PUBLIC_API_BASE_URL` environment variable.  
Default: `http://localhost:8000`

---

## Response Conventions

| Status | Meaning |
|--------|---------|
| `200`  | Success (with body) |
| `201`  | Created (with body) |
| `204`  | Success (no body) — used for DELETE |
| `400`  | Validation error — `{ "message": "..." }` |
| `401`  | Unauthenticated — token missing or invalid |
| `403`  | Forbidden — user lacks permission |
| `404`  | Resource not found |
| `500`  | Internal server error — `{ "message": "..." }` |

---

## Endpoints

### 1. Users

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/users/me` | Get current user profile | — | `UserProfile` |
| `PATCH` | `/api/users/me` | Update profile fields | `Partial<UserProfile>` | `UserProfile` |

```typescript
type UserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt: string; // ISO
};
```

---

### 2. Todos

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/todos` | List all todos for user | — | `TodoItem[]` |
| `POST` | `/api/todos` | Create a todo | `Omit<TodoItem, 'id'>` | `TodoItem` |
| `PUT` | `/api/todos/:id` | Update a todo | `Partial<TodoItem>` | `TodoItem` |
| `DELETE` | `/api/todos/:id` | Delete a todo | — | `204` |

```typescript
type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  postponed?: boolean;
};
```

---

### 3. Transactions

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/transactions` | List all transactions | — | `Transaction[]` |
| `POST` | `/api/transactions` | Create a transaction | `Omit<Transaction, 'id'>` | `Transaction` |
| `PUT` | `/api/transactions/:id` | Update a transaction | `Partial<Transaction>` | `Transaction` |
| `DELETE` | `/api/transactions/:id` | Delete a transaction | — | `204` |
| `GET` | `/api/transactions/budget` | Get monthly budget | — | `{ budget: number }` |
| `PUT` | `/api/transactions/budget` | Update monthly budget | `{ budget: number }` | `{ budget: number }` |

```typescript
type Transaction = {
  id: string;
  date: string; // 'yyyy-MM-dd'
  description: string;
  category: string;
  amount: number; // cents
  type: 'income' | 'expense' | 'fee';
};
```

---

### 4. Habits

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/habits` | List all habits | — | `Habit[]` |
| `GET` | `/api/habits?context=gym` | List habits (gym context) | — | `Habit[]` |
| `POST` | `/api/habits` | Create a habit | `Omit<Habit, 'id'>` | `Habit` |
| `PUT` | `/api/habits/:id` | Update a habit | `Partial<Habit>` | `Habit` |
| `DELETE` | `/api/habits/:id` | Delete a habit | — | `204` |

```typescript
type Habit = {
  id: string;
  name: string;
  icon: string;
  target?: number;
  completions: Record<string, boolean | number>;
  habitType?: 'repetitive' | 'sprint';
  sprintDuration?: number;
  sprintEndDate?: string;
  sprintStartDate?: string;
};
```

---

### 5. Notes

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/notes` | List all notes | — | `Note[]` |
| `POST` | `/api/notes` | Create a note | `Omit<Note, 'id'>` | `Note` |
| `PUT` | `/api/notes/:id` | Update a note | `Partial<Note>` | `Note` |
| `DELETE` | `/api/notes/:id` | Delete a note | — | `204` |

```typescript
type Note = {
  id: string;
  title: string;
  content: string | ChecklistItem[] | SnippetContent;
  type: 'text' | 'checklist' | 'markdown' | 'snippet';
  createdAt: string; // ISO
};
```

---

### 6. Credentials (Password Vault)

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/credentials` | List all credentials | — | `Credential[]` |
| `POST` | `/api/credentials` | Create a credential | `Omit<Credential, 'id'>` | `Credential` |
| `PUT` | `/api/credentials/:id` | Update a credential | `Partial<Credential>` | `Credential` |
| `DELETE` | `/api/credentials/:id` | Delete a credential | — | `204` |

> **Security Note**: Passwords should be encrypted at rest in the backend database.

```typescript
type Credential = {
  id: string;
  name: string;
  category: 'Website' | 'Banking' | 'Social Media' | 'Other';
  lastUpdated: string;
  username?: string;
  password?: string;
  website?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiPin?: string;
  netbankingId?: string;
  mpin?: string;
  netbankingPassword?: string;
  transactionPassword?: string;
};
```

---

### 7. Notifications

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/notifications` | List all notifications | — | `Notification[]` |
| `POST` | `/api/notifications` | Create a notification | `Omit<Notification, 'id' | 'createdAt'>` | `Notification` |
| `PATCH` | `/api/notifications/:id` | Mark as read | `{ read: true }` | `Notification` |
| `POST` | `/api/notifications/mark-all-read` | Mark all as read | — | `204` |
| `DELETE` | `/api/notifications/:id` | Delete a notification | — | `204` |

`Notification` supports optional metadata fields for future feature-specific notifications:

```ts
type Notification = {
  id: string;
  title: string;
  date: string;
  message: string;
  read: boolean;
  sourceType?: string;
  sourceId?: string;
  actionUrl?: string;
  createdAt?: string;
};
```

---

### 8. Goals

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/goals` | List all goals | — | `Goal[]` |
| `GET` | `/api/goals/:id` | Get a single goal | — | `Goal` |
| `POST` | `/api/goals` | Create a goal | `Omit<Goal, 'id' \| 'createdAt' \| 'updatedAt'>` | `Goal` |
| `PUT` | `/api/goals/:id` | Update a goal | `Partial<Goal>` | `Goal` |
| `DELETE` | `/api/goals/:id` | Delete a goal | — | `204` |

> Goal type includes nested `progressTrackers[]`, `subGoals[]`, `notes[]`,
> `resources[]`, and `linkedHabitIds[]`. See `frontend/src/types/index.ts`
> for the full type definition.

---

### 9. Planner

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/planner` | Get weekly schedule | — | `Record<string, PlannerItem[]>` |
| `PUT` | `/api/planner/:day` | Update a day's schedule | `{ items: PlannerItem[] }` | `Record<string, PlannerItem[]>` |
| `POST` | `/api/planner/:day/items` | Add item to a day | `Omit<PlannerItem, 'id'>` | `PlannerItem` |
| `PUT` | `/api/planner/:day/items/:id` | Update a planner item | `Partial<PlannerItem>` | `PlannerItem` |
| `DELETE` | `/api/planner/:day/items/:id` | Delete a planner item | — | `204` |

```typescript
type PlannerItem = {
  id: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  title: string;
  tag?: string;
};
```

---

### 10. Gym

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/gym/workout-split` | Get workout split | — | `CyclicalWorkoutSplit` |
| `PUT` | `/api/gym/workout-split` | Update workout split | `CyclicalWorkoutSplit` | `CyclicalWorkoutSplit` |
| `GET` | `/api/gym/cycle-config` | Get cycle config | — | `CycleConfig` |
| `PUT` | `/api/gym/cycle-config` | Update cycle config | `CycleConfig` | `CycleConfig` |
| `GET` | `/api/gym/protein-intakes` | List protein intakes | — | `ProteinIntake[]` |
| `POST` | `/api/gym/protein-intakes` | Add protein intake | `Omit<ProteinIntake, 'id'>` | `ProteinIntake` |
| `DELETE` | `/api/gym/protein-intakes/:id` | Delete protein intake | — | `204` |
| `GET` | `/api/gym/food-log` | List logged food items | — | `LoggedFoodItem[]` |
| `POST` | `/api/gym/food-log` | Add food item | `Omit<LoggedFoodItem, 'id'>` | `LoggedFoodItem` |
| `DELETE` | `/api/gym/food-log/:id` | Delete food item | — | `204` |
| `GET` | `/api/gym/completions` | Get completed workouts | — | `CompletedWorkouts` |
| `PUT` | `/api/gym/completions` | Toggle workout completion | `{ date: string, completed: boolean }` | `CompletedWorkouts` |
| `GET` | `/api/gym/custom-foods` | Get custom food list | — | `string[]` |
| `PUT` | `/api/gym/custom-foods` | Update custom food list | `{ foods: string[] }` | `string[]` |
| `GET` | `/api/gym/protein-target` | Get daily protein target | — | `{ target: number }` |
| `PUT` | `/api/gym/protein-target` | Update protein target | `{ target: number }` | `{ target: number }` |

> See `frontend/src/types/index.ts` for `Exercise`, `WorkoutDay`,
> `CyclicalWorkoutSplit`, `CycleConfig`, `ProteinIntake`, `LoggedFoodItem`,
> and `CompletedWorkouts` type definitions.

---

### 11. User Preferences

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/preferences` | Get user preferences | — | `UserPreferences` |
| `PUT` | `/api/preferences` | Update preferences | `Partial<UserPreferences>` | `UserPreferences` |

```typescript
type UserPreferences = {
  features: {
    waterIntake: boolean;
    todaysPlan: boolean;
    financialSnapshot: boolean;
    todoList: boolean;
    habitStreaks: boolean;
    gymTracker: boolean;
    proteinIntake: boolean;
    foodSupplements: boolean;
    overloadTracker: boolean;
    gymProteinIntake: boolean;
    gymFoodSupplements: boolean;
    proteinIntakeWidget: boolean;
    supplementIntakeWidget: boolean;
  };
  onboarding?: { ... };
};
```

---

### 12. AI Chat

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `POST` | `/api/ai/chat` | Send chat message | `AiChatRequest` | `AiChatResponse` |

```typescript
type AiChatRequest = {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  personality?: string;
  model?: string;
};

type AiChatResponse = {
  result: string;
  model?: string;
};
```

---

### 13. Push Notifications

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `POST` | `/api/push/subscribe` | Save push subscription | `{ subscription: PushSubscriptionJSON }` | `{ success: boolean, message: string }` |
| `POST` | `/api/push/unsubscribe` | Remove subscription | `{ endpoint: string }` | `{ success: boolean, message: string }` |
| `POST` | `/api/push/send-test` | Send test notification | — | `{ success: boolean, message: string }` |

Push payloads delivered to the service worker use this shape:

```ts
type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    sourceType?: string;
    sourceId?: string;
  };
};
```

---

### 14. Admin Endpoints

> All admin endpoints require the authenticated user to have `role: 'admin'`.

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/admin/check` | Check admin status | — | `{ isAdmin: boolean }` |
| `GET` | `/api/admin/users` | List all users | — | `UserStats[]` |
| `GET` | `/api/admin/ai-config` | Get AI configuration | — | `AiConfiguration` |
| `PUT` | `/api/admin/ai-config` | Update AI configuration | `Partial<AiConfiguration>` | `AiConfiguration` |
| `GET` | `/api/admin/settings` | Get system settings | — | `SystemSettings` |
| `PUT` | `/api/admin/settings` | Update system settings | `Partial<SystemSettings>` | `SystemSettings` |
| `GET` | `/api/admin/announcements` | List announcements | — | `Announcement[]` |
| `POST` | `/api/admin/announcements` | Create announcement | `Omit<Announcement, 'id' \| 'createdAt'>` | `Announcement` |
| `PUT` | `/api/admin/announcements/:id` | Update announcement | `Partial<Announcement>` | `Announcement` |
| `DELETE` | `/api/admin/announcements/:id` | Delete announcement | — | `204` |
| `GET` | `/api/admin/about` | Get about page content | — | `AboutPageContent` |
| `PUT` | `/api/admin/about` | Update about page content | `Partial<AboutPageContent>` | `AboutPageContent` |

> See `frontend/src/types/index.ts` for full type definitions of
> `UserStats`, `AiConfiguration`, `SystemSettings`, `Announcement`, and
> `AboutPageContent`.

---

## Quick Start for Backend Developers

1. Create a server that listens on `http://localhost:8000`
2. Add Firebase Admin SDK to verify `Authorization: Bearer <token>` headers
3. Extract `uid` from the verified token to scope all queries
4. Implement the endpoints above with any database (PostgreSQL, MongoDB, SQLite, etc.)
5. Set `NEXT_PUBLIC_USE_MOCK_API=false` in the frontend `.env` file
6. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
7. Start both servers — the frontend will connect automatically

## CORS Configuration

The backend must allow requests from the frontend origin:

```
Access-Control-Allow-Origin: http://localhost:9002 (or your frontend URL)
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```
