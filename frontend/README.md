# LifeOS

Next.js App Router app with Firebase Auth + Firestore, Tailwind/Shadcn UI, and optional Web Push notifications.

## Quick start

1) Install deps

```bash
npm install
```
###################################

2) Create `.env.local` (see `.env.local.example` for required keys)

3) Run the dev server (PWA disabled in dev)

```bash
npm run dev
```

Open http://localhost:9002

## Scripts

- `npm run dev` — start Next dev server on port 9002
- `npm run build` — production build
- `npm start` — start production server
- `npm run lint` — Next lint
- `npm run typecheck` — TypeScript `--noEmit`

## Data model (Firestore)

- User profile: `users/{uid}`
- Per-feature docs: `users/{uid}/data/{featureKey}` with `{ items: ... }`
	- Examples: `notes`, `habits`, `transactions`, `passwords`, `notifications`, etc.
	- See `src/app/notes/page.tsx` for canonical `{ items: T[] }` CRUD with `onSnapshot` + `setDoc`.

New users are seeded on first login by `src/hooks/use-auth.tsx`.

## Auth & APIs

- Client Firebase SDK in `src/lib/firebase.ts` (browser only)
- Admin SDK in `src/lib/firebase-admin.ts` (server only)
- API routes under `src/app/api/**` must:
	- Verify Firebase ID token from `Authorization: Bearer <token>` via `verifyIdToken(req)`
	- Use `adminDb` for Firestore access

Push notifications: `src/app/api/push/{subscribe,unsubscribe,send-test}`; subscriptions stored at `users/{uid}/pushSubscriptions/{base64(endpoint)}`.

## UI shell

- `src/components/layout/AppLayout.tsx` wraps protected pages, handles redirect to `/login`, theme classes, notifications bell, and bottom nav.
- Use `AppLayout` for pages under `/dashboard`, `/notes`, `/habits`, `/expenses`, etc.

## Key files

- `src/app/layout.tsx` — root layout, PWA meta, AuthProvider
- `src/hooks/use-auth.tsx` — auth state + first-run data seeding
- `src/components/layout/AppLayout.tsx` — shell + theme controller
- `src/types/index.ts` — shared types
- `src/lib/utils.ts` — `cn` and helpers

## Environment

Copy `.env.local.example` to `.env.local` and fill values. Notes:

- `FIREBASE_ADMIN_PRIVATE_KEY` must keep literal `\n` newlines (code replaces at runtime)
- PWA is disabled in development; service worker only in production

## Notes

AI flows in `src/ai/*` are deprecated; don’t add new AI code unless required.
