import { apiErrorSchema } from '@app/contracts'

/** Turn any thrown value or API error body into a message safe to show to users. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const parsed = apiErrorSchema.safeParse(error)
  if (parsed.success) return parsed.data.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/** Throw the API error body so TanStack Query / try-catch receive it. */
export function unwrap<T>(result: { data?: T; error?: unknown }): T {
  if (result.error !== undefined) throw result.error
  return result.data as T
}
