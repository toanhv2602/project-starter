# Project Engineering Guide

## Project

TypeScript pnpm monorepo, modular monolith:

- `apps/web`: Vue 3 + Vite. Pinia = client state, TanStack Query = server state.
- `apps/api`: NestJS + Fastify + Prisma (PostgreSQL). REST under `/api/v1`, OpenAPI at `/docs`.
- `apps/worker`: BullMQ consumers. Jobs must be idempotent.
- `packages/contracts`: Zod schemas shared by all apps. **Single source of truth** for request,
  response and job payload shapes.
- `packages/api-client`: generated from OpenAPI (`pnpm api:generate`). Never edit by hand.
- PostgreSQL is the source of truth; Redis is for queues/cache only.
- Do not introduce microservices or new infrastructure without an approved ADR (`docs/architecture/decisions`).

## Commands

- `pnpm dev` — all apps in watch mode (needs `pnpm infra:up`)
- `pnpm verify` — what CI runs; must pass before a change is done
- `pnpm --filter @app/api test` — API integration tests (real Postgres + Redis)
- `pnpm db:migrate:dev --name <change>` — after editing `schema.prisma`
- `pnpm api:generate` — after changing any API endpoint or DTO

## How to add a feature

Follow `docs/NEW_FEATURE.md` step by step: contract → Prisma model + migration → API module →
integration tests → `pnpm api:generate` → UI. Reference implementations: `modules/auth`,
`modules/users` (API), `pages/LoginPage.vue`, `pages/HomePage.vue` (web).

## API rules

- Controllers: HTTP mapping only. Services: use cases. Map Prisma models to contract types in one
  `toDto()`; never return Prisma models directly.
- DTOs come from contracts: `class XDto extends createZodDto(xSchema) {}`. Validation is global.
- Every route requires auth unless marked `@Public()`. Use `@CurrentUser()`, `@Roles()`.
- Scope every query by owner/tenant. Another user's resource → 404.
- Expected errors: `throw new AppError(status, 'STABLE_CODE', 'Human message')`.
- Cross-module access only through an exported service, never another module's Prisma queries.
- Inject config with `@InjectEnv() env: Env`; add new variables to `config/env.ts` **and**
  `.env.example`. Never read `process.env` elsewhere.
- Use explicit transactions for multi-write operations.

## Database

- Every schema change needs a migration. Review the generated SQL.
- Never edit a migration applied to a shared environment. Never use `db push` or `migrate reset`
  outside a disposable local database.
- snake_case via `@map`, UUID ids, `@db.Timestamptz(3)`, indexes for real query patterns.

## Frontend rules

- `<script setup lang="ts">`, Composition API. Feature hooks in `src/features/<name>/`.
- Use the typed `api` client (`@/lib/api`) and `unwrap()`. Never call `fetch` directly.
- Handle loading, error, empty and success states. Validate forms with the contract schema.
- Frontend checks are UX only; the API enforces authorization.

## Security

- Never log or commit secrets, tokens, passwords or personal data. The logger redacts common
  fields; do not add new ones to log context.
- Access token stays in memory; refresh token is an HttpOnly cookie. Do not change this without
  updating `docs/security/authentication.md`.

## Testing and completion

- API: integration tests in `apps/api/test` with `createTestApp`, `resetDatabase`, `signUp`.
  Cover 401, validation 400, ownership 404, happy path.
- Unit-test pure logic next to the code (`*.spec.ts` / `*.test.ts`).
- Workflow: inspect → plan → implement → test → review diff.
- Never claim a command passed unless it was run. Never weaken or delete tests to pass CI.

## Definition of done

Requirements met; architecture rules respected; validation and auth correct; tests added and
passing; migrations, contracts, generated client and docs updated; `pnpm verify` passes; no
secrets or debug artifacts; remaining risks reported.
