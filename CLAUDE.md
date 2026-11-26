# Project Engineering Guide

## Project
TypeScript pnpm monorepo:
- `apps/web`: Vue 3 + Vite + TypeScript
- `apps/api`: NestJS + Fastify + Prisma
- `apps/worker`: BullMQ background worker
- `packages/contracts`: shared Zod contracts
- PostgreSQL is the source of truth; Redis is cache/queue infrastructure.
- Architecture: Modular Monolith. Do not introduce microservices without an approved ADR.

## Commands
- `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`
- `pnpm db:generate`, `pnpm db:migrate:dev`, `pnpm db:migrate:deploy`

## Architecture rules
- Each business module owns its domain rules and persistence boundary.
- Cross-module calls use exported application interfaces; never import another module's private repository.
- Keep controllers thin. Application services orchestrate use cases.
- Domain code must not depend on NestJS, Prisma, HTTP or infrastructure.
- Avoid circular dependencies and premature abstractions.
- Use REST under `/api/v1`; document it with OpenAPI.

## TypeScript and validation
- Strict TypeScript. Avoid `any`; use `unknown` and narrow.
- Validate all untrusted input at boundaries.
- Do not duplicate generated API types manually.
- Never trust frontend validation for security.

## Database
- Prisma is the default ORM.
- Every schema change requires a migration.
- Use `prisma migrate dev` locally and `prisma migrate deploy` in deployed environments.
- Never use `db push` in staging/production.
- Use raw SQL only for a justified query/feature Prisma cannot express well.
- Review indexes, constraints, transaction boundaries and query plans.
- Never edit a migration already applied to a shared environment.

## Authentication security
- Access tokens must be short-lived.
- Store only a cryptographic hash of refresh tokens.
- Rotate refresh tokens on use and revoke token families on detected reuse.
- Never log credentials, bearer tokens, refresh tokens or secrets.
- Enforce authorization in the backend.
- Keep JWT secrets outside source control and use a secret manager in production.
- Add rate limiting and account abuse protections before public launch.
- Treat the auth code as a foundation until flows have integration tests and security review.

## Frontend
- Vue 3 Composition API with `<script setup lang="ts">`.
- Pinia is for client state; TanStack Query is for server state.
- Handle loading, error, empty and success states.
- Keep components focused; move reusable behavior into composables.

## Testing and completion
- Unit-test domain and application logic.
- Integration-test persistence against PostgreSQL, not SQLite substitutes.
- Test auth, authorization, validation and failure paths.
- Use Playwright for critical user journeys.
- For each change: inspect → plan → implement → test → review diff.
- Never claim a command passed unless it was actually executed.
- Do not weaken/delete tests merely to make CI pass.

## Definition of done
Requirements met; architecture respected; validation/auth correct; tests pass;
migrations/contracts/docs updated; no secrets/debug artifacts; remaining risks reported.
