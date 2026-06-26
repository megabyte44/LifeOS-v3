# LifeOS-v3 — Refactor Plan: Remove 4 Features

**Goal:** Strip 4 half-baked features so the app stays a focused AI-interlinked life tool. Keep: Notes, AI Chat + RAG, Habits, Planner, Todos, Notifications, Admin.

**Removing:** Gym + food log · Transactions/Expenses · Credentials/Password manager · Goals

**Rule:** Pure deletion + reference cleanup. No new logic. Touch nothing in the AI/RAG core except to drop dead references.

---

## Targets (from codebase index)

**Frontend (Next.js)**
- Pages: `src/app/gym/`, `src/app/expenses/`, `src/app/password-manager/`, `src/app/goals/`
- Services: `src/services/{gym,transaction,credential,goal}.service.ts` + remove exports in `src/services/index.ts`
- Hooks: `src/hooks/api/` → `useGym`, `useTransactions`, `useGoals`, `useCredential*`
- Types: drop matching interfaces in `src/types/index.ts`
- Nav/UI refs: `components/layout/*` (sidebar), `components/command-palette.tsx`, `components/quick-capture.tsx`, dashboard widgets

**Backend (Spring/Java)** — per feature, delete its `Service`, `Controller`, `Repository`, entity/model, DTOs:
- Gym: GymService + GymCompletion, CustomFood, FoodLogItem, ProteinTarget
- Transactions: TransactionService + Budget
- Credentials: CredentialService + Credential
- Goals: GoalService + Goal, GoalNote, GoalResource
- SQL: add a new migration to drop those tables (don't edit old migrations)

**AI layer (careful — keep core intact)**
- `PromptAssemblyService` / context builder: remove `appendFinanceSnapshot` + any gym/goal snapshot
- `QueryIntentClassifier`: remove gym/finance/goal intents + their unit tests
- `MemoryGraph`/insight services: drop references to removed entity types only

---

## Checkpoints

### ✅ CP0 — Branch & baseline
- [ ] `git checkout -b refactor/remove-4-features`
- [ ] Confirm app builds (frontend + backend) before changes

### ✅ CP1 — Frontend removal
- [ ] Delete the 4 pages, 4 services, related hooks, type defs
- [ ] Remove nav/command-palette/dashboard references
- [ ] `npm run build` passes (no dangling imports)

### ✅ CP2 — Backend removal
- [ ] Delete services, controllers, repositories, entities, DTOs for the 4 features
- [ ] Add SQL migration dropping the removed tables
- [ ] `mvn compile` passes (no unresolved refs)

### ✅ CP3 — AI layer cleanup
- [ ] Remove finance/gym/goal snapshots from context assembly
- [ ] Remove their intents + tests from QueryIntentClassifier
- [ ] `mvn test` passes

### ✅ CP4 — Verify & ship
- [ ] Full build both sides; grep for leftover `gym|transaction|credential|goal|expense|password-manager`
- [ ] Smoke test: login → AI chat → notes/habits/planner work
- [ ] Update `FEATURES_AUDIT.md` and README to reflect new scope
- [ ] Merge

---

## Risk notes
- AI context + intent classifier are the only shared seams — clean refs there or chat breaks. Everything else is isolated per-feature.
- Use a *new* DROP migration; never edit historical migrations.
- Auth/security (`SecurityUtils`) is shared and stays.
