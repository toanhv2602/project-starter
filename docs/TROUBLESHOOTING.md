# Troubleshooting

Every item here was hit while validating this starter.

## Install

**`ERR_PNPM_UNSUPPORTED_ENGINE` for a deep dependency.** Some packages require a recent Node 22
patch release. Update Node to the latest 22.x (`nvm install 22`). The repo deliberately does not
set `engine-strict`, so this is a warning unless you enable it.

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

**TypeScript 6.** Major TypeScript updates are ignored by Dependabot until migrated on purpose.
Known blockers found when testing TypeScript 6.0:

- tsup 8.5 always passes `baseUrl` to the DTS build → `TS5101`. Fix: in `packages/*/tsup.config.ts`
  set `dts: { compilerOptions: { ignoreDeprecations: '6.0' } }` (invalid on TypeScript 5, so change
  it together with the upgrade).
- `apps/api` uses `moduleResolution: Node10` → `TS5107`. Fix: move to `module`/`moduleResolution`
  `Node16`, add `.js` extensions to relative imports, and keep `vitest.config.ts` out of the
  CommonJS type check (it imports ESM-only packages).

Run `pnpm verify` and the e2e tests after the migration.
