# LifeOS Interview Prep Kit

A self-contained reference for explaining LifeOS in technical interviews. Every file is grounded in the actual codebase — real file paths, function names, and config keys.

## Elevator Pitch

> LifeOS is a full-stack personal life-management platform with an embedded AI second brain. Users capture notes, habits, todos, and a daily planner — and a context-aware AI assistant that knows their life through a three-layer RAG pipeline: vector search over embeddings, BM25-hybrid memory retrieval, and a knowledge graph built from conversation history.

## Tech Stack (Quick Reference)

| Layer | Technology |
|---|---|
| Backend | Spring Boot 4.x, Java 17 |
| Auth | Firebase Admin SDK + custom `FirebaseAuthenticationFilter` |
| Database | PostgreSQL + pgvector extension |
| Migrations | Flyway |
| AI / LLM | OpenAI, OpenRouter, Gemini (runtime-swappable via `AiConfigurationResolver`) |
| Embeddings | `text-embedding-3-small` (1536 dims) via `OpenAiEmbeddingClient` |
| Streaming | Spring WebFlux `WebClient` → `SseEmitter` |
| Frontend | Next.js 16, React 19, TypeScript |
| UI | shadcn/ui + Radix UI primitives, Tailwind CSS |
| Data fetching | TanStack React Query v5 |
| PWA | `@ducanh2912/next-pwa` (service worker, offline page, push notifications) |
| Push Notifications | Web Push (VAPID) via `nl.martijndwars:web-push` |

---

## Files in This Kit

| File | What It Covers |
|---|---|
| [01-project-overview.md](./01-project-overview.md) | What LifeOS is, features, full stack table, repo structure, resume bullet |
| [02-architecture.md](./02-architecture.md) | ASCII system diagram, architectural patterns, folder breakdown, data models, auth flow |
| [03-backend-deep-dive.md](./03-backend-deep-dive.md) | Spring Boot internals, auth, RBAC, all API routes, service/controller pattern, testing |
| [04-frontend-deep-dive.md](./04-frontend-deep-dive.md) | Next.js App Router, data fetching, state management, key components, PWA decisions |
| [05-rag-pipeline.md](./05-rag-pipeline.md) | The RAG + memory extraction pipeline — the most complex feature in the project |
| [06-design-decisions.md](./06-design-decisions.md) | 8–10 "why did you choose X" decisions with alternatives and trade-offs |
| [07-interview-qa.md](./07-interview-qa.md) | Scripted answers + rapid-fire Q&A for common interview questions |

---

## How to Use This With Claude

Paste the file that matches the question you're being asked:

- "Walk me through the architecture" → paste `02-architecture.md`
- "How does your AI feature work?" → paste `05-rag-pipeline.md`
- "Why did you pick X over Y?" → paste `06-design-decisions.md`
- "Tell me about this project" → paste `07-interview-qa.md` opener

You can also load the whole kit at once: paste this README + all 7 files, then ask Claude to simulate a technical interview round.
