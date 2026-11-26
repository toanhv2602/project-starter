# First run checklist

1. Install Node.js 22 LTS and pnpm 10.
2. Copy `.env.example` to `.env`; replace both JWT secrets with independent random values.
3. Run `pnpm install` and commit the generated `pnpm-lock.yaml`.
4. Run `docker compose up -d postgres redis`.
5. Run `pnpm db:generate`.
6. Run `pnpm db:migrate:dev -- --name init` if no initial migration exists.
7. Run `pnpm dev`.

## Before production
- Add production Docker Compose and private networking.
- Configure managed secrets, database, Redis and object storage.
- Implement complete auth endpoints, refresh rotation/reuse detection, guards and integration tests.
- Add rate limiting, security headers, request IDs, structured log redaction.
- Add Playwright E2E, image scanning, secret scanning and deployment approvals.
- Verify Docker build contexts and install strategy against the committed lockfile.
- Run backup restore and rollback drills.
