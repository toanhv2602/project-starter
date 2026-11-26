<script setup lang="ts">
import { loginSchema } from '@app/contracts'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const error = ref<string | null>(null)
const submitting = ref(false)

async function submit(): Promise<void> {
  error.value = null
  const parsed = loginSchema.safeParse(form)
  if (!parsed.success) {
    error.value = 'Enter a valid email and password'
    return
  }
  submitting.value = true
  try {
    await auth.login(parsed.data)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    // Only allow internal redirects (prevents open-redirect via ?redirect=https://evil).
    await router.push(redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="card narrow">
    <h1>Sign in</h1>
    <form novalidate @submit.prevent="submit">
      <label>
        Email
        <input v-model="form.email" type="email" autocomplete="email" required />
      </label>
      <label>
        Password
        <input v-model="form.password" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="submitting">
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
    <p class="muted">No account? <RouterLink to="/register">Create one</RouterLink></p>
  </section>
</template>
