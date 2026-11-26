# Full Node Starter

A TypeScript pnpm monorepo starter for a Vue 3 + NestJS (Fastify) Modular Monolith.

## Stack

- `apps/web`: Vue 3, Vite, TypeScript
- `apps/api`: NestJS + Fastify, Prisma, PostgreSQL, JWT foundation
- `apps/worker`: BullMQ worker foundation
- `packages/contracts`: shared Zod schemas
- PostgreSQL + Redis via Docker Compose
- Claude Code guidance, project Skills, MCP config, GitHub Actions

## Requirements

- Node.js 22 LTS (or the currently supported Node LTS)
- pnpm 10+
- Docker Engine + Docker Compose

## Quick start

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres redis
pnpm db:generate
pnpm db:migrate:dev
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/docs
- Health: http://localhost:3000/api/v1/health

## Important

This is a starter scaffold, not a security-audited production authentication implementation.
Before exposing it publicly, implement and test the complete auth flows, rate limits,
email verification/password reset if required, cookie/CSRF policy if cookies are used,
secret management, migrations, backups, monitoring and deployment hardening.

## Workspace commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm db:generate
pnpm db:migrate:dev
pnpm db:migrate:deploy
```

See `docs/` and `CLAUDE.md` before extending the system.
