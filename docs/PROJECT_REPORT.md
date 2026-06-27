# LifeOS-v3 Repository Report

This report is based only on repository contents verified in code, configuration, SQL migrations, manifests, and documentation.

## 1. Project Overview

LifeOS v3 is a full-stack personal life management application that combines productivity, planning, finance tracking, note-taking, fitness logging, credential storage, notifications, and AI chat into a single system.

### What problem the project solves

- Replaces fragmented use of separate apps for tasks, habits, budgets, notes, passwords, and fitness.
- Centralizes personal workflows under one authenticated user profile.
- Adds AI assistance on top of the user’s productivity and lifestyle data.

### Core idea of the product

- A personal operating system for everyday life management.
- A mobile-friendly PWA frontend with protected app shell and offline behavior.
- A Firebase-authenticated Spring Boot backend with user-scoped PostgreSQL data.

### Target users

- Individual users managing personal productivity and self-organization.
- Students or personal power users are strongly suggested by the product copy and About page.

### Key value proposition

- One app for tasks, planner, habits, notes, expenses, passwords, gym, notifications, and AI chat.
- Real backend persistence and authentication instead of a purely local demo app.
- Offline-capable frontend with PWA behavior and Web Push notifications.

## 2. Feature Breakdown

### Dashboard

- What it does: Aggregates habits, todos, expenses, hydration, and gym-related widgets into a single view.
- Where it is implemented:
  - `frontend/src/app/dashboard/page.tsx`
  - `frontend/src/hooks/api/use-habits.ts`
  - `frontend/src/hooks/api/use-todos.ts`
  - `frontend/src/hooks/api/use-transactions.ts`

### Todos

- What it does: CRUD task list with completion, priority, and postponed state.
- Where it is implemented:
  - `frontend/src/services/todo.service.ts`
  - `frontend/src/hooks/api/use-todos.ts`
  - `backend/src/main/java/com/lifos/backend/controller/TodoController.java`
  - `backend/src/main/java/com/lifos/backend/service/TodoService.java`
  - `backend/src/main/resources/db/migration/V2__create_todos_table.sql`

### Planner

- What it does: Time-block scheduling by day with item-level CRUD.
- Where it is implemented:
  - `frontend/src/app/planner/page.tsx`
  - `frontend/src/services/planner.service.ts`
  - `backend/src/main/java/com/lifos/backend/controller/PlannerController.java`
  - `backend/src/main/java/com/lifos/backend/service/PlannerService.java`
  - `backend/src/main/resources/db/migration/V10__create_planner_tables.sql`

### Habits

- What it does: Tracks user habits with target values, sprint mode, and date-based completion history.
- Where it is implemented:
  - `frontend/src/app/habits/page.tsx`
  - `frontend/src/services/habit.service.ts`
  - `backend/src/main/java/com/lifos/backend/controller/HabitController.java`
  - `backend/src/main/java/com/lifos/backend/entity/Habit.java`
  - `backend/src/main/resources/db/migration/V4__create_habits_table.sql`

### Goals

- What it does: Supports goals with sub-goals, progress trackers, linked habits, notes, and resources.
- Where it is implemented:
  - `frontend/src/app/goals/page.tsx`
  - `frontend/src/services/goal.service.ts`
  - `frontend/src/types/index.ts`
  - `backend/src/main/java/com/lifos/backend/controller/GoalController.java`
  - `backend/src/main/java/com/lifos/backend/service/GoalService.java`
  - `backend/src/main/resources/db/migration/V9__create_goals_tables.sql`

### Expenses and Budget

- What it does: Stores transactions and a per-user budget.
- Where it is implemented:
  - `frontend/src/app/expenses/page.tsx`
  - `frontend/src/services/transaction.service.ts`
  - `backend/src/main/java/com/lifos/backend/controller/TransactionController.java`
  - `backend/src/main/java/com/lifos/backend/entity/Transaction.java`
  - `backend/src/main/java/com/lifos/backend/entity/Budget.java`
  - `backend/src/main/resources/db/migration/V3__create_transactions_table.sql`

### Notes

- What it does: Supports text, markdown, checklist, and snippet notes using JSONB content.
- Where it is implemented:
  - `frontend/src/app/notes/page.tsx`
  - `frontend/src/components/MarkdownRenderer.tsx`
  - `frontend/src/components/NoteContentViewer.tsx`
  - `frontend/src/services/note.service.ts`
  - `backend/src/main/java/com/lifos/backend/controller/NoteController.java`
  - `backend/src/main/resources/db/migration/V5__create_notes_table.sql`
  - `backend/src/main/resources/db/migration/V14__add_notes_updated_at.sql`

### Password Manager

- What it does: Stores credentials and banking-related secrets, encrypted at rest.
- Where it is implemented:
  - `frontend/src/app/password-manager/page.tsx`
  - `frontend/src/services/credential.service.ts`
  - `backend/src/main/java/com/lifos/backend/controller/CredentialController.java`
  - `backend/src/main/java/com/lifos/backend/service/CredentialService.java`
  - `backend/src/main/java/com/lifos/backend/security/EncryptionService.java`
  - `backend/src/main/resources/db/migration/V6__create_credentials_table.sql`

### Gym and Nutrition

- What it does: Manages workout split, cycle config, protein intake, food logs, custom foods, completions, and protein target.
- Where it is implemented:
  - `frontend/src/app/gym/page.tsx`
  - `frontend/src/services/gym.service.ts`
  - `backend/src/main/java/com/lifos/backend/controller/GymController.java`
  - `backend/src/main/java/com/lifos/backend/service/GymService.java`
  - `backend/src/main/resources/db/migration/V11__create_gym_tables.sql`

### Notifications

- What it does: Supports in-app notifications with read state and metadata fields.
- Where it is implemented:
  - `frontend/src/app/notifications/page.tsx`
  - `frontend/src/services/notification.service.ts`
  - `backend/src/main/java/com/lifos/backend/controller/NotificationController.java`
  - `backend/src/main/java/com/lifos/backend/service/NotificationService.java`
  - `backend/src/main/resources/db/migration/V7__create_notifications_table.sql`
  - `backend/src/main/resources/db/migration/V15__add_notification_metadata.sql`

### Push Notifications

- What it does: Saves browser subscriptions, removes them, and sends test pushes through a shared dispatch path.
- Where it is implemented:
  - `frontend/src/services/push.service.ts`
  - `frontend/src/lib/notifications.ts`
  - `frontend/src/worker/index.ts`
  - `backend/src/main/java/com/lifos/backend/controller/PushController.java`
  - `backend/src/main/java/com/lifos/backend/service/WebPushService.java`
  - `backend/src/main/java/com/lifos/backend/service/NotificationDispatchService.java`
  - `backend/src/main/resources/db/migration/V13__create_push_subscriptions_table.sql`

### Preferences and Settings

- What it does: Stores per-user feature flags and onboarding settings.
- Where it is implemented:
  - `frontend/src/app/settings/page.tsx`
  - `frontend/src/services/preference.service.ts`
  - `backend/src/main/java/com/lifos/backend/controller/PreferenceController.java`
  - `backend/src/main/resources/db/migration/V8__create_preferences_table.sql`

### Profile

- What it does: Fetches and updates current user profile data.
- Where it is implemented:
  - `frontend/src/app/profile/page.tsx`
  - `frontend/src/services/user.service.ts`
  - `backend/src/main/java/com/lifos/backend/controller/UserController.java`
  - `backend/src/main/java/com/lifos/backend/service/UserService.java`

### AI Chat

- What it does: Sends chat requests to an admin-configured AI provider with model and personality support.
- Where it is implemented:
  - `frontend/src/app/ai-chat/page.tsx`
  - `frontend/src/services/ai-chat.service.ts`
  - `backend/src/main/java/com/lifos/backend/controller/AiChatController.java`
  - `backend/src/main/java/com/lifos/backend/service/AiChatService.java`
  - `backend/src/main/java/com/lifos/backend/config/AiFoundationProperties.java`

### Admin Module

- What it does: Supports admin checks, user stats, AI config, system settings, announcements, and about-page content management.
- Where it is implemented:
  - `frontend/src/app/admin/page.tsx`
  - `frontend/src/app/admin/users/page.tsx`
  - `frontend/src/app/admin/ai-config/page.tsx`
  - `frontend/src/app/admin/system-settings/page.tsx`
  - `frontend/src/app/admin/announcements/page.tsx`
  - `frontend/src/app/admin/about/page.tsx`
  - `frontend/src/services/admin.service.ts`
  - `backend/src/main/java/com/lifos/backend/controller/AdminController.java`
  - `backend/src/main/java/com/lifos/backend/service/AdminService.java`
  - `backend/src/main/resources/db/migration/V12__create_admin_tables.sql`

### Reminders

- What it does: Provides calendar-style reminders, birthdays, anniversaries, and deadlines.
- Where it is implemented:
  - `frontend/src/app/reminders/page.tsx`
- Important note: This feature is frontend-local and uses localStorage. There is no backend reminder API or reminder table in the repository.

## 3. Architecture

### Frontend framework

- Next.js 15 App Router.
- Root layout and metadata: `frontend/src/app/layout.tsx`
- Protected app shell: `frontend/src/components/layout/AppLayout.tsx`
- PWA config: `frontend/next.config.mjs`

### Backend architecture

- Spring Boot 4 layered architecture.
- Main structure:
  - `config/`
  - `controller/`
  - `service/`
  - `repository/`
  - `entity/`
  - `dto/`
  - `security/`
  - `exception/`
- Package root: `backend/src/main/java/com/lifos/backend`

### Database

- PostgreSQL is the primary database.
- Flyway manages schema migrations.
- Hibernate only validates schema at runtime.
- pgvector extension has been enabled for future vector/RAG work.

### API structure

- Main API surface is the Spring backend under `/api/**`.
- Controllers define domain-specific REST resources.
- Frontend consumes APIs via `frontend/src/lib/api-client.ts` and service files under `frontend/src/services/`.
- There are also a few Next.js route handlers under `frontend/src/app/api`, but several are placeholders or proxies and are not the main application backend path.

### State management

- TanStack Query manages server state.
- Local React state is used for page-local UI behavior.
- localStorage is used for some frontend-only features such as reminders and theme preferences.

### Authentication

- Frontend uses Firebase client auth.
- Backend verifies Firebase ID tokens through a custom security filter.
- Backend auto-creates user records on first authenticated request.

### External services

- Firebase Authentication and Firebase Admin SDK.
- AI providers through OpenAI-compatible APIs and Gemini.
- VAPID-based Web Push.

## 4. Tech Stack

### Frameworks and core runtime

- Spring Boot 4.0.3
- Java 17
- Next.js 15
- React 18
- TypeScript

### Backend libraries

- Spring Data JPA
- Spring Security
- Spring Web MVC
- Spring WebFlux
- Flyway
- Firebase Admin SDK
- PostgreSQL JDBC driver
- Hibernate Vector
- Lombok
- Web Push library
- Bouncy Castle

### Frontend libraries

- TanStack React Query
- Radix UI
- Tailwind CSS
- dnd-kit
- Firebase JS SDK
- date-fns
- react-hook-form
- Zod
- Recharts
- react-markdown
- remark-gfm
- rehype-sanitize
- next-pwa

### Database and infrastructure

- PostgreSQL 16
- pgvector
- Docker
- Docker Compose

### Dev tools

- Maven Wrapper
- ESLint
- TypeScript compiler
- PostCSS

## 5. Folder Structure Explanation

### Root

- `README.md`: top-level product and setup guide.
- `backend/`: Spring Boot backend.
- `frontend/`: Next.js frontend.
- `.github/prompts/`: AI planning and prompt artifacts.

### Backend

- `backend/src/main/java/com/lifos/backend/config`: security, Firebase, web, and app config.
- `backend/src/main/java/com/lifos/backend/controller`: REST controllers.
- `backend/src/main/java/com/lifos/backend/service`: business logic.
- `backend/src/main/java/com/lifos/backend/repository`: persistence interfaces.
- `backend/src/main/java/com/lifos/backend/entity`: JPA entities.
- `backend/src/main/java/com/lifos/backend/dto`: API request/response shapes.
- `backend/src/main/java/com/lifos/backend/security`: auth filter and encryption code.
- `backend/src/main/resources/db/migration`: Flyway migrations.

### Frontend

- `frontend/src/app`: routes, pages, and App Router API handlers.
- `frontend/src/components`: shared layout, UI, and rendering components.
- `frontend/src/hooks`: auth, admin, and API hooks.
- `frontend/src/services`: service adapters and mock/real service resolution.
- `frontend/src/lib`: API client, Firebase setup, notification helpers, utilities.
- `frontend/src/providers`: React Query provider.
- `frontend/src/types`: shared domain types.
- `frontend/src/worker`: service worker implementation.

## 6. Database Design

The database is fully Flyway-managed in PostgreSQL.

### Main tables

- `users`: root user table keyed by Firebase UID.
- `todos`: user task records.
- `transactions`: money records.
- `budgets`: per-user budget singleton.
- `habits`: habits with JSONB completion history.
- `notes`: notes with polymorphic JSONB content.
- `credentials`: encrypted vault records.
- `notifications`: in-app notifications.
- `preferences`: per-user feature and onboarding settings.
- `goals`: top-level goals.
- `progress_trackers`: goal progress rows.
- `sub_goals`: nested sub-goals.
- `goal_notes`: notes attached to goals.
- `goal_resources`: resources attached to goals.
- `planner_items`: user schedule blocks.
- `workout_splits`: per-user workout split singleton.
- `cycle_configs`: per-user gym cycle config singleton.
- `protein_intakes`: protein log.
- `food_log`: food log.
- `gym_completions`: workout completion map singleton.
- `custom_foods`: custom foods singleton.
- `protein_targets`: protein target singleton.
- `ai_configurations`: global AI configuration singleton.
- `system_settings`: global settings singleton.
- `announcements`: admin-managed announcements.
- `about_page`: admin-managed about content singleton.
- `push_subscriptions`: stored web push subscriptions.

### Relationships

- Most user data references `users.uid` via `user_uid` foreign keys.
- Goals have one-to-many child tables for trackers, notes, resources, and sub-goals.
- `sub_goals` is self-referential through `parent_id`.
- Several modules use singleton-per-user patterns enforced through unique `user_uid` constraints.

### Models and schema sources

- Entity classes live in `backend/src/main/java/com/lifos/backend/entity/`.
- Source-of-truth schema lives in `backend/src/main/resources/db/migration/`.

## 7. API Documentation

All `/api/**` routes require Firebase Bearer authentication unless otherwise indicated by code or docs.

### Users

- `GET /api/users/me`: returns current user profile.
- `PATCH /api/users/me`: updates current user profile fields.

### Todos

- `GET /api/todos`: list todos.
- `POST /api/todos`: create todo.
- `PUT /api/todos/{id}`: update todo.
- `DELETE /api/todos/{id}`: delete todo.

### Transactions

- `GET /api/transactions`: list transactions.
- `POST /api/transactions`: create transaction.
- `PUT /api/transactions/{id}`: update transaction.
- `DELETE /api/transactions/{id}`: delete transaction.
- `GET /api/transactions/budget`: get budget.
- `PUT /api/transactions/budget`: update budget.

### Habits

- `GET /api/habits`: list habits, optional `context` query.
- `POST /api/habits`: create habit.
- `PUT /api/habits/{id}`: update habit.
- `DELETE /api/habits/{id}`: delete habit.

### Notes

- `GET /api/notes`: list notes.
- `POST /api/notes`: create note.
- `PUT /api/notes/{id}`: update note.
- `DELETE /api/notes/{id}`: delete note.

### Credentials

- `GET /api/credentials`: list credentials.
- `POST /api/credentials`: create credential.
- `PUT /api/credentials/{id}`: update credential.
- `DELETE /api/credentials/{id}`: delete credential.

### Notifications

- `GET /api/notifications`: list notifications.
- `POST /api/notifications`: create notification.
- `PATCH /api/notifications/{id}`: mark as read.
- `POST /api/notifications/mark-all-read`: mark all as read.
- `DELETE /api/notifications/{id}`: delete notification.

### Goals

- `GET /api/goals`: list goals.
- `GET /api/goals/{id}`: get one goal.
- `POST /api/goals`: create goal.
- `PUT /api/goals/{id}`: update goal.
- `DELETE /api/goals/{id}`: delete goal.

### Planner

- `GET /api/planner`: get schedule.
- `PUT /api/planner/{day}`: replace a day schedule.
- `POST /api/planner/{day}/items`: add planner item.
- `PUT /api/planner/{day}/items/{id}`: update planner item.
- `DELETE /api/planner/{day}/items/{id}`: delete planner item.

### Gym

- `GET /api/gym/workout-split`
- `PUT /api/gym/workout-split`
- `GET /api/gym/cycle-config`
- `PUT /api/gym/cycle-config`
- `GET /api/gym/protein-intakes`
- `POST /api/gym/protein-intakes`
- `DELETE /api/gym/protein-intakes/{id}`
- `GET /api/gym/food-log`
- `POST /api/gym/food-log`
- `DELETE /api/gym/food-log/{id}`
- `GET /api/gym/completions`
- `PUT /api/gym/completions`
- `GET /api/gym/custom-foods`
- `PUT /api/gym/custom-foods`
- `GET /api/gym/protein-target`
- `PUT /api/gym/protein-target`

### Preferences

- `GET /api/preferences`
- `PUT /api/preferences`

### Push

- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`
- `POST /api/push/send-test`

### AI

- `POST /api/ai/chat`

### Admin

- `GET /api/admin/check`
- `GET /api/admin/users`
- `GET /api/admin/ai-config`
- `PUT /api/admin/ai-config`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`
- `GET /api/admin/announcements`
- `POST /api/admin/announcements`
- `PUT /api/admin/announcements/{id}`
- `DELETE /api/admin/announcements/{id}`
- `GET /api/admin/about`
- `PUT /api/admin/about`

### Request and response format sources

- Contract doc: `frontend/src/services/API_CONTRACT.md`
- Backend DTOs: `backend/src/main/java/com/lifos/backend/dto/`

## 8. Key Engineering Decisions

- Firebase token verification happens on the backend, not just in the client.
- Flyway controls schema evolution; Hibernate validates only.
- JSONB is used to keep dynamic personal-data shapes flexible.
- Credentials use AES-256-GCM encryption before persistence.
- Role-based access is enforced with Spring method security.
- TanStack Query is used for API state and cache management.
- PWA behavior and offline routing are built into the frontend.
- Notifications use a unified persistence-plus-push pipeline.
- Mock and real services can be swapped from one environment variable.
- pgvector and AI foundation config indicate planned RAG expansion, but current implemented chat is still `/api/ai/chat`.

## 9. Deployment

### Backend deployment

- Dockerized with a multi-stage build in `backend/Dockerfile`.
- Composed with PostgreSQL in `backend/docker-compose.yml`.

### Frontend deployment

- Standard Next.js `build` and `start` flow.
- PWA assets generated into `public/`.

### Environment variables

- Backend template: `backend/.env.example`
- Frontend template: `frontend/.env.example`

### Build system

- Backend: Maven Wrapper.
- Frontend: Next.js build pipeline.

### CI/CD

- No workflow files were found under `.github/workflows`.
- No CI/CD pipeline is defined in the repository.

## 10. Resume-Ready Description

LifeOS v3 is a full-stack personal productivity platform built with Next.js, React, Spring Boot, and PostgreSQL that unifies task management, habit tracking, goal planning, budgeting, secure credential storage, gym logging, notifications, and AI chat in a single PWA. The system uses Firebase-authenticated REST APIs, Flyway-managed schema design with JSONB for flexible user data, AES-256-GCM encryption for sensitive vault fields, Web Push notifications, React Query for client-side data orchestration, and Dockerized backend deployment with PostgreSQL and pgvector support.

## 11. Interview Questions

1. Why does the project use JSONB for several user data domains instead of fully normalizing all tables?
2. How does Firebase authentication propagate from the frontend into Spring Security?
3. Why use Flyway with `ddl-auto: validate` instead of automatic schema generation?
4. How is sensitive credential data protected at rest?
5. Why is TanStack Query a good fit for this frontend?
6. How does the unified notification dispatch pipeline work?
7. What are the benefits of the mock-vs-real service resolver?
8. How are complex goal structures modeled relationally?
9. What tradeoffs exist in the current PWA caching strategy?
10. How would you extend the current AI chat into a RAG system using the pgvector groundwork already present?
11. Why do some Next.js route handlers exist as stubs while the main app calls the Spring backend directly?
12. What would you improve to make the admin UI fully production-ready?

## 12. Unique Aspects of the Project

- The product spans productivity, finance, fitness, notes, credentials, notifications, and AI in one authenticated system.
- The backend has real domain depth rather than a shallow demo API.
- Sensitive credential data is encrypted, which is uncommon for portfolio productivity projects.
- The frontend combines offline support, push notifications, and app-shell UX.
- The repo supports both mock and real backend development modes.
- The codebase already includes early groundwork for vector-based AI expansion.
- The admin surface adds operational controls beyond typical personal project scope.

## Additional Observations

- `frontend/README.md` still documents an older Firestore/Admin-SDK-oriented backend story and does not fully match the current direct Spring backend integration.
- Some frontend App Router API handlers are placeholders or stubs, while the Spring backend provides the real domain implementation.