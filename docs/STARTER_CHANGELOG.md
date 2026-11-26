# Starter changelog

Problems found while validating the original starter by building a real project from it, and
how each was fixed. (This file is removed from projects created with create-project.)

| Problem                                                                                        | Fix                                                                                     |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| API crashed on start: `ValidationPipe` needs class-validator (not installed); docs said Zod    | Global `ZodValidationPipe` (nestjs-zod 5) with DTOs generated from shared contracts     |
| `@nestjs/swagger@8` incompatible with Nest 11; Fastify needs `@fastify/static`                 | swagger 11 + `@fastify/static` 10; `cleanupOpenApiDoc` for Zod schemas                  |
| Root `.env` not found by Nest or Prisma (both look in `apps/api`)                              | Upward `.env` lookup in code; `dotenv -e ../../.env` for Prisma scripts                 |
| Docker runtime could not resolve modules (pnpm symlinks); `--no-frozen-lockfile`               | Single Dockerfile, `pnpm fetch` + `pnpm deploy --legacy`, frozen lockfile               |
| No `.dockerignore` (`.env` copied into images)                                                 | `.dockerignore`                                                                         |
| Web image did not use the nginx config (no SPA fallback)                                       | Config copied; nginx also proxies `/api`, adds security headers                         |
| Prisma engines missing on Alpine                                                               | Debian slim images                                                                      |
| `@app/contracts` exported raw `.ts` (unusable by compiled CJS API)                             | tsup dual ESM/CJS build with per-condition type declarations                            |
| `vite.config.ts` used `test` key with Vite's `defineConfig` (type error)                       | `defineConfig` from `vitest/config`                                                     |
| ESLint could not parse `<script lang="ts">` in `.vue` files                                    | `vue-eslint-parser` + TS parser; single root config                                     |
| Jest installed without config (`--passWithNoTests` hid it)                                     | Vitest everywhere; SWC plugin for Nest decorators                                       |
| `engine-strict=true` blocked installs because of a transitive dependency                       | Removed; Node version in `.nvmrc`, checked by `pnpm onboard`                            |
| `injectWorkspacePackages` made apps use a stale copy of shared packages                        | Plain workspace symlinks                                                                |
| pnpm 10 silently skipped Prisma/argon2/esbuild install scripts                                 | `onlyBuiltDependencies`                                                                 |
| Fixed host ports clashed with locally installed Postgres                                       | `POSTGRES_PORT`/`REDIS_PORT` + `pnpm onboard` picks free ports                          |
| Tests shared the dev database and Redis queue                                                  | `test` schema + Redis DB 15; guard against non-local DBs                                |
| CRLF line endings on Windows break shell scripts in containers                                 | `.gitattributes` (`eol=lf`)                                                             |
| lint-staged failed on ESLint-ignored generated files                                           | `--no-warn-ignored`                                                                     |
| Repo not formatted: `format:check` would fail the first CI run                                 | Formatted; Prettier config committed                                                    |
| Auth was a stub                                                                                | Register/login/refresh/logout/me with rotation + reuse detection, guards, roles, tests  |
| No env validation, logging policy, health checks, error format, shutdown                       | Zod env, pino + redaction, request IDs, live/ready probes, error filter, shutdown hooks |
| Dependabot bumped single `@nestjs/*` packages to a new major → CI failed (mixed Nest 11/12)    | Group `@nestjs/*`, Prisma, Vitest, ESLint updates in `dependabot.yml`                   |
| Dependabot TypeScript 6 PR failed (tsup `baseUrl`, API `Node10` resolution)                    | TS majors ignored until a planned migration; steps in `TROUBLESHOOTING.md`              |
| Dependencies updated to latest stable (NestJS 12, Prisma 7, TS 6, Vite 8, Vitest 5, ESLint 10) | `module: Node20` for ESM-only Nest, `prisma.config.ts` + pg adapter, BullMQ 6 types     |
| Prisma 7 + pg ignores `?schema=`: test reset could have truncated dev data in `public`         | `createPrismaAdapter()` sets schema + `search_path`; `resetDatabase()` checks schema    |
| `onboard` only checked the Node major version                                                  | Checks `engines.node` (now >= 22.22, required by jsdom 31)                              |
