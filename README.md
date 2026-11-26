# Full Node Starter

Production-minded TypeScript monorepo: **Vue 3 + NestJS (Fastify) + Prisma/PostgreSQL + BullMQ/Redis**,
organised as a modular monolith.

| Path                  | What                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `apps/web`            | Vue 3, Vite, Pinia (client state), TanStack Query (server state)   |
| `apps/api`            | NestJS + Fastify, Prisma, JWT auth with refresh-token rotation     |
| `apps/worker`         | BullMQ worker (background jobs)                                    |
| `packages/contracts`  | Zod schemas shared by web, api and worker (single source of truth) |
| `packages/api-client` | Typed HTTP client generated from the API's OpenAPI document        |
| `infra/nginx`         | nginx config for the web image (SPA + `/api` reverse proxy)        |
| `docs/`               | Architecture, ADRs, runbooks, security notes, feature recipe       |

Included out of the box: env validation (fails fast), structured logs with secret redaction,
request IDs, Helmet, rate limiting, global error format, liveness/readiness probes, graceful
shutdown, integration tests against real Postgres, Docker images, CI, git hooks, Claude Code setup.

## Start a new project from this starter

```bash
node scripts/create-project.mjs ../my-app --title "My App"
cd ../my-app
```

The script copies the starter (without `node_modules`, `.env`, `.git`), renames it and creates
the first commit. Then follow **Quick start** below.

## Quick start

Requirements: Node.js 22.22+ (see `.nvmrc` and `engines`), pnpm 10 (`corepack enable`), Docker.

```bash
pnpm install
pnpm onboard            # creates .env with generated secrets and free ports
pnpm infra:up           # Postgres + Redis in Docker
pnpm db:migrate:deploy  # apply migrations
pnpm db:seed            # optional: admin@example.com
pnpm dev                # web + api + worker with hot reload
```

- Web: http://localhost:5173 (calls the API through the Vite proxy: same origin)
- API: http://localhost:3000/api/v1 — Swagger: http://localhost:3000/docs
- Health: `/api/v1/health/live`, `/api/v1/health/ready`

## Commands

| Command                  | Purpose                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `pnpm dev`               | Run everything in watch mode                                                                       |
| `pnpm verify`            | format check + lint + typecheck + tests + build (same as CI)                                       |
| `pnpm test`              | Unit + integration tests (needs Postgres + Redis running)                                          |
| `pnpm test:e2e`          | Playwright journeys; starts `pnpm dev` itself. Set `PW_CHANNEL=msedge` to use an installed browser |
| `pnpm lint` / `lint:fix` | ESLint for the whole repo                                                                          |
| `pnpm format`            | Prettier                                                                                           |
| `pnpm db:migrate:dev`    | Create + apply a migration after editing `schema.prisma`                                           |
| `pnpm db:migrate:deploy` | Apply pending migrations (CI / deployed environments)                                              |
| `pnpm api:generate`      | Regenerate the typed API client after changing endpoints                                           |
| `pnpm infra:up` / `down` | Start / stop local Postgres + Redis                                                                |

## Adding a feature

Follow [docs/NEW_FEATURE.md](docs/NEW_FEATURE.md): contract → schema/migration → API module →
integration tests → `pnpm api:generate` → UI. It takes you through every file in order.

## Deployment

One `Dockerfile` with three targets (`api`, `worker`, `web`) and a production compose file for a
single VM. See [docs/runbooks/deployment.md](docs/runbooks/deployment.md).

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) (Windows paths, busy ports, Docker in WSL,
stale shared packages, Prisma safety prompts).

## Before going public

The auth flows are implemented and tested, but still review: email verification, password reset,
MFA and account lockout policy; a Redis store for rate limiting when running more than one API
replica; secret management; backups and restore drills; monitoring and alerting. See
[docs/security/authentication.md](docs/security/authentication.md).
