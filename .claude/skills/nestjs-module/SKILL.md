---
name: nestjs-module
description: Create or modify a business module in the NestJS + Fastify API (controller, service, DTOs, Prisma model, integration tests). Use for any new endpoint or API feature.
---

# NestJS Module

Follow `docs/NEW_FEATURE.md` steps 1–5. Summary:

1. Read `apps/api/src/modules/auth` and `modules/users` for conventions.
2. Contract first: Zod schemas in `packages/contracts/src/<feature>.ts`, export from `index.ts`,
   run `pnpm build:packages`.
3. Prisma model in `apps/api/prisma/schema.prisma` → `pnpm db:migrate:dev --name <change>` →
   review the SQL.
4. Module files in `apps/api/src/modules/<feature>/`:
   - `dto/<feature>.dto.ts`: `class CreateXDto extends createZodDto(createXSchema) {}`
   - `<feature>.service.ts`: queries scoped by `ownerId`; `AppError` for expected errors;
     `static toDto()` mapping to the contract type.
   - `<feature>.controller.ts`: `@CurrentUser()`, `ParseUUIDPipe` for ids, Swagger response types.
   - `<feature>.module.ts`, then add it to `AppModule` imports.
5. Integration tests in `apps/api/test/<feature>.spec.ts` using `createTestApp`,
   `resetDatabase`, `signUp`: 401, 400, 404 for other users' data, happy path, pagination.
6. `pnpm api:generate` and commit the generated client.
7. Run `pnpm --filter @app/api typecheck`, `pnpm --filter @app/api test`, then `pnpm verify`.
   Report any check you could not run.
