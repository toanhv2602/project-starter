import { type AuthResponse, type LoginInput, type RegisterInput, type User } from '@app/contracts'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, refreshSession } from '@/lib/api'
import { unwrap } from '@/lib/errors'

/**
 * The access token lives only in memory (never localStorage: XSS could steal it).
 * The refresh token is an HttpOnly cookie the JavaScript cannot read; on page load we
 * call `restore()` to exchange it for a new access token.
 */
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)
  const restored = ref(false)
  const isAuthenticated = computed(() => accessToken.value !== null)

  function setSession(session: AuthResponse): void {
    accessToken.value = session.accessToken
    user.value = session.user
  }

  function clearSession(): void {
    accessToken.value = null
    user.value = null
  }

  async function login(input: LoginInput): Promise<void> {
    setSession(unwrap(await api.POST('/api/v1/auth/login', { body: input })) as AuthResponse)
  }

  async function register(input: RegisterInput): Promise<void> {
    setSession(unwrap(await api.POST('/api/v1/auth/register', { body: input })) as AuthResponse)
  }

  async function logout(): Promise<void> {
    try {
      await api.POST('/api/v1/auth/logout')
    } finally {
      clearSession()
    }
  }

  /** Try to resume a session from the refresh cookie. Runs once per page load. */
  async function restore(): Promise<void> {
    if (restored.value) return
    restored.value = true
    await refreshSession()
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    setSession,
    clearSession,
    login,
    register,
    logout,
    restore,
  }
})
