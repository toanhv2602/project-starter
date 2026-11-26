---
name: testing-strategy
description: Plan or implement unit, integration and end-to-end tests for a feature or bug.
---

# Testing Strategy

- Derive tests from acceptance criteria and failure modes.
- API integration tests (`apps/api/test/*.spec.ts`) run the real app via `app.inject()` against
  Postgres (`test` schema) and Redis (DB 15). Helpers: `createTestApp`, `resetDatabase`, `signUp`.
- Always cover: unauthenticated 401, validation 400, another user's resource 404, happy path.
- Unit-test pure logic next to the code (`*.spec.ts` in api, `*.test.ts` elsewhere) with Vitest.
- Worker processors: call the processor function directly with a fake `Job`.
- Add a regression test before or with every bug fix.
- Do not mock the behaviour under test. Do not use SQLite instead of Postgres.
- Report exact commands and results; never claim tests passed without running them.
