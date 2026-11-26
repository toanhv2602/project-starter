# Troubleshooting

Every item here was hit while validating this starter.

## Install

**`Unsupported engine` / `ERR_PNPM_UNSUPPORTED_ENGINE`, or web tests fail with `Failed to start forks
worker`.** The repo needs Node >= 22.22 (`engines` in `package.json`; jsdom 31 requires it).
Update Node to the latest 22.x (`nvm install 22`). `pnpm onboard` checks this.

**Windows: `spawnSync ... esbuild.exe ENOENT` or other odd install failures.** The path is longer
than 260 characters. Keep repos in a short path (for example `C:\dev\my-app`). `subst` and
junctions do not help: Node resolves them back to the long path.

**pnpm says "Ignored build scripts".** pnpm 10 blocks dependency install scripts unless they are
listed in `onlyBuiltDependencies` (`pnpm-workspace.yaml`). Add a package there only if it needs
a native binary; list intentionally skipped ones in `ignoredBuiltDependencies`.

**Do not run `pnpm setup`.** It is a built-in pnpm command that edits your PATH. This repo's
first-run script is `pnpm onboard`.

## Local infrastructure

**Port 5432/6379 already in use** (a local Postgres/Redis service). `pnpm onboard` picks free
ports and writes `POSTGRES_PORT`/`REDIS_PORT` plus matching URLs into `.env`. For an existing
`.env`, change those values by hand.

**Docker only inside WSL (no Docker Desktop).** Run `docker compose up -d --wait postgres redis`
inside WSL from the repo folder (`/mnt/c/...`). Ports on `127.0.0.1` are forwarded to Windows.
If `docker` hangs, the WSL distro may have just started: wait for `systemctl is-active docker`
to print `active`.

## Development

**API cannot find `@app/contracts` / types are stale.** Shared packages are consumed from their
`dist/` output. `pnpm dev`, `pnpm test` and `pnpm typecheck` build them first; if you run a
single app directly, run `pnpm build:packages` first (or keep `pnpm dev` running: it watches
`packages/contracts`).

**Prisma: "DATABASE_URL not found".** Prisma CLI scripts load the root `.env` through
`dotenv-cli`. Run them through `pnpm db:*` scripts, not `npx prisma ...` from another folder.

**Prisma refuses `migrate reset` when run by an AI agent.** Intended safety feature. Tests do
not need resets (they use `migrate deploy` on the `test` schema and truncate tables). If your
test schema is broken after rewriting a local migration, drop the `test` schema yourself.

**Tests: "Refusing to run tests against non-local database host".** Tests truncate tables, so
they only run against `localhost`/`postgres` unless `ALLOW_REMOTE_TEST_DB=true`.

**Commit blocked by the pre-commit hook.** lint-staged runs Prettier and ESLint on staged files.
Fix the reported problem; do not bypass the hook with `--no-verify`.

## Docker

**`docker build` is extremely slow from WSL on a `/mnt/c/...` repo.** Docker scans the build
context over the Windows file share (including every `node_modules` symlink, even though they are
ignored). Clone the repo inside the WSL filesystem (`~/code/...`) for Docker work, or build from
a clean export: `git archive HEAD | tar -x -C /tmp/build && docker build /tmp/build`.

**`pnpm deploy` output is missing `dist/`.** `pnpm deploy` follows `.gitignore` unless the
package has a `"files"` field. Keep `"files": ["dist", ...]` in `apps/api` and `apps/worker`.

**Refresh does not work in production.** The refresh cookie is `Secure` when
`COOKIE_SECURE=true`, so the site must be served over HTTPS. The SPA and API must be on the same
site (nginx proxies `/api`), because the cookie is `SameSite=Strict`.

## Dependency updates

**A Dependabot PR for one `@nestjs/*` package fails with `Cannot find module '@nestjs/common/internal'`.**
NestJS packages must share the same major version. `.github/dependabot.yml` groups `@nestjs/*`
(and Prisma, Vitest, ESLint) so they are bumped together in one PR. If an old single-package PR is
still open, close it and wait for the grouped one.

**`pnpm update --latest` installs a Prisma release candidate.** The `latest` npm tag of `prisma`
has pointed at an 8.0 RC. Keep `prisma`, `@prisma/client` and `@prisma/adapter-pg` on the same
stable version (check `npm view @prisma/client dist-tags`).

**TypeScript 7.** Not supported yet by typescript-eslint, vue-tsc and the Nest CLI, so Dependabot
ignores TypeScript majors. Upgrade when those tools support it, then run `pnpm verify` and e2e.

**NestJS 12 is ESM-only.** The API still emits CommonJS and loads Nest with `require()` of ESM
(Node >= 22.12). That is why `apps/api/tsconfig.json` uses `"module": "Node20"`; `Node10`/`CommonJS`
fail with `TS1479`. Dynamic `import()` of local files needs the `.js` extension (see `main.ts`).

**Prisma 7: "The datasource property `url` is no longer supported".** The URL lives in
`apps/api/prisma.config.ts`, and `PrismaService` connects through `@prisma/adapter-pg`.
Create clients with `createPrismaAdapter()`: it maps `?schema=` to the adapter and `search_path`.
