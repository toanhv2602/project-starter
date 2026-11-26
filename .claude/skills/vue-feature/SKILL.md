---
name: vue-feature
description: Implement a frontend feature using Vue 3, TypeScript, Pinia and TanStack Query against the typed API client.
---

# Vue Feature

1. Make sure the API endpoints exist and `pnpm api:generate` has been run.
2. Hooks in `apps/web/src/features/<feature>/use-<feature>.ts`:
   - one `keys` object for query keys;
   - `useQuery` with `queryFn: async () => unwrap(await api.GET('/api/v1/...', { params }))`;
   - `useMutation` that invalidates the affected keys on success.
3. Page in `apps/web/src/pages/<Feature>Page.vue` with `<script setup lang="ts">`:
   loading, error (`errorMessage(err)`), empty and success states; responsive at 375px.
4. Validate forms with the same contract schema the API uses (`schema.safeParse(form)`).
5. Add the route in `src/router.ts` with `meta: { requiresAuth: true }` and a nav link if needed.
6. Pinia only for client-owned shared state (e.g. auth session), never for server data.
7. Run `pnpm --filter @app/web typecheck`, `pnpm --filter @app/web test`, `pnpm lint`.
