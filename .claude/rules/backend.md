---
paths:
  - "apps/api/**/*.ts"
  - "apps/worker/**/*.ts"
---

- Keep controllers thin and validate every external input.
- Do not leak Prisma types through HTTP response contracts.
- Use explicit transaction boundaries for atomic multi-write operations.
- Never log tokens, passwords, authorization headers or secrets.
