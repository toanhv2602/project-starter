import { createApiClient, type Middleware } from '@app/api-client'
import { type AuthResponse } from '@app/contracts'
import { useAuthStore } from '@/stores/auth'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

/** Client without auth middleware: used for the refresh call itself (avoids recursion). */
const rawClient = createApiClient({ baseUrl })

let refreshInFlight: Promise<boolean> | null = null

/**
 * Exchange the HttpOnly refresh cookie for a new access token.
 * Single-flight: concurrent 401s share one refresh request, because the server treats a
 * second use of the same refresh token as theft and revokes the session.
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const { data } = await rawClient.POST('/api/v1/auth/refresh')
      const auth = useAuthStore()
      if (data) {
        auth.setSession(data as AuthResponse)
        return true
      }
      auth.clearSession()
      return false
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

const retryable = new Map<string, Request>()

const authMiddleware: Middleware = {
  onRequest({ request, id }) {
    const token = useAuthStore().accessToken
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    retryable.set(id, request.clone())
    return request
  },
  async onResponse({ response, id }) {
    const original = retryable.get(id)
    retryable.delete(id)
    const isAuthCall = original?.url.includes('/api/v1/auth/') ?? true
    if (response.status !== 401 || !original || isAuthCall) return response

    // Access token expired: refresh once, then replay the original request.
    if (!(await refreshSession())) return response
    original.headers.set('Authorization', `Bearer ${useAuthStore().accessToken}`)
    return fetch(original)
  },
  onError({ id }) {
    retryable.delete(id)
  },
}

export const api = createApiClient({ baseUrl })
api.use(authMiddleware)
