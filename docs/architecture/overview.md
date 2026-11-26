# Architecture Overview

## Topology

```
Browser ──► nginx (web image) ──► static SPA
                  │
                  └── /api ──► NestJS API (Fastify) ──► PostgreSQL
                                     │
                                     └── enqueue ──► Redis (BullMQ) ──► Worker
```

The SPA and API share one origin (Vite proxy in dev, nginx in production). This keeps the
refresh cookie `SameSite=Strict` and removes CORS from the normal path.

## Boundaries

- `apps/web`: presentation, client state (Pinia), server state (TanStack Query).
- `apps/api`: HTTP transport + business modules (`src/modules/*`). Cross-cutting concerns live in
  `src/common` (errors, guards, decorators) and `src/infrastructure` (Prisma, Redis, queues).
- `apps/worker`: background job consumers. Jobs are idempotent and validate payloads with the
  shared contract. Queue names and payload schemas live in `packages/contracts/src/jobs.ts`.
- `packages/contracts`: Zod schemas for HTTP and job payloads. The API generates DTOs and
  OpenAPI from them; the web uses them for form validation and types.
- `packages/api-client`: typed client generated from OpenAPI.
- `apps/api/prisma`: schema and migrations.

## Request pipeline (API)

`ThrottlerGuard → JwtAuthGuard (@Public to skip) → RolesGuard → ZodValidationPipe → controller
→ service → AllExceptionsFilter` (uniform `{ statusCode, code, message, requestId }` errors).

## Rules

- One deployable API; the worker is a separate process sharing contracts, not code.
- A module owns its tables. Other modules use its exported service, never its Prisma queries.
- No microservices until scale, isolation or team ownership justifies the operational cost (ADR).
- Reliable side effects (email, webhooks) that must not be lost: introduce a transactional outbox
  before relying on fire-and-forget enqueueing.
