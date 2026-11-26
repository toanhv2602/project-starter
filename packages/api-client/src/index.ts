import createClient, { type ClientOptions, type Middleware } from 'openapi-fetch'
import type { components, paths } from './schema'

/**
 * Typed client generated from the API's OpenAPI document.
 * Regenerate after changing API endpoints: `pnpm api:generate` (CI fails if stale).
 */
export type { components, paths, Middleware }
export type Schemas = components['schemas']

export function createApiClient(options: ClientOptions = {}) {
  return createClient<paths>({ credentials: 'include', ...options })
}

export type ApiClient = ReturnType<typeof createApiClient>
