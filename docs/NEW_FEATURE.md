# Adding a feature (end to end)

This is the exact path used to build the "Tasks" feature in the reference project. Follow the
steps in order; each one has a check so problems surface early. Replace `tasks`/`Task` with your
feature name.

## 1. Contract (`packages/contracts/src/tasks.ts`)

Define request and response shapes with Zod, then export them from `src/index.ts`.

```ts
export const taskSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  dueDate: z.iso.date().nullable(),
  createdAt: z.iso.datetime(),
})
export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  dueDate: z.iso.date().nullish(),
})
export const listTasksQuerySchema = paginationQuerySchema.extend({
  status: taskStatusSchema.optional(),
})
export const taskListSchema = z.object({ items: z.array(taskSchema), meta: paginationMetaSchema })
```

Rules: response schemas describe the API, not the database (no `passwordHash`, no internal
columns). Dates travel as ISO strings.

Check: `pnpm build:packages`

## 2. Database (`apps/api/prisma/schema.prisma`)

Add the model with `@@map` snake_case names, UUID id, `@db.Timestamptz(3)` timestamps, an owner
foreign key with `onDelete` chosen deliberately, and an index matching your main query.

```bash
pnpm db:migrate:dev --name add_tasks
```

Check: review the generated SQL in `prisma/migrations/*/migration.sql` before committing.
Never edit a migration that has been applied to a shared environment.

## 3. API module (`apps/api/src/modules/tasks/`)

```
tasks.module.ts       registers controller + service (add it to AppModule imports)
tasks.controller.ts   HTTP mapping only: params, body, status codes, Swagger decorators
tasks.service.ts      use cases + persistence; every query scoped by the current user
dto/tasks.dto.ts      class DTOs generated from the contracts: createZodDto(createTaskSchema)
```

Conventions:

- All routes require a JWT by default. Use `@Public()` only for anonymous routes, `@Roles('ADMIN')`
  for role checks, `@CurrentUser()` to get the caller.
- Validation is automatic: `@Body() body: CreateTaskDto` / `@Query() q: ListTasksQueryDto` are
  validated by the global ZodValidationPipe. Use `ParseUUIDPipe` for `:id` params.
- Throw `new AppError(HttpStatus.NOT_FOUND, 'TASK_NOT_FOUND', 'Task not found')` for expected
  errors. The global filter returns `{ statusCode, code, message, requestId }`.
- Return another user's resource as **404**, not 403 (do not reveal that it exists).
- Map Prisma models to contract types in one `toDto()` function.
- Another module needs your data? Export the service from your module; never import another
  module's Prisma queries.

Check: `pnpm --filter @app/api typecheck`

## 4. Integration tests (`apps/api/test/tasks.spec.ts`)

Tests run against real Postgres (schema `test`) and Redis (DB 15). Use the helpers in
`test/test-app.ts`:

```ts
beforeAll(async () => (app = await createTestApp()))
beforeEach(async () => {
  await resetDatabase(app)
  alice = await signUp(app) // { userId, headers: { authorization } }
})
```

Cover at least: unauthenticated (401), happy path, validation (400), another user's data (404),
pagination/filters.

Check: `pnpm --filter @app/api test`

## 5. Typed client

```bash
pnpm api:generate   # exports OpenAPI and regenerates packages/api-client
```

Commit `packages/api-client/openapi.json` and `src/schema.d.ts`. CI fails if they are stale.

## 6. UI (`apps/web/src/`)

```
features/tasks/use-tasks.ts   TanStack Query hooks (query keys, queries, mutations + invalidation)
pages/TasksPage.vue           page: loading / error / empty / success states
router.ts                     route with meta: { requiresAuth: true }
```

```ts
const tasks = useQuery({
  queryKey: computed(() => ['tasks', 'list', { page: page.value }]),
  queryFn: async () =>
    unwrap(await api.GET('/api/v1/tasks', { params: { query: { page: page.value } } })),
})
```

Paths, params and response types are checked against the API at compile time. Validate forms
with the same Zod schema the API uses (`createTaskSchema.safeParse(form)`).

Check: `pnpm --filter @app/web typecheck`

## 7. Finish

```bash
pnpm verify
```

Then open a PR using the template checklist.
