<script setup lang="ts">
import { registerSchema } from '@app/contracts'
import { reactive, ref } from 'vue'
import { z } from 'zod'
import { useRouter } from 'vue-router'
import { errorMessage } from '@/lib/errors'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ displayName: '', email: '', password: '' })
const fieldErrors = ref<Partial<Record<keyof typeof form, string>>>({})
const error = ref<string | null>(null)
const submitting = ref(false)

async function submit(): Promise<void> {
  error.value = null
  // Same Zod schema as the API: instant feedback, but the server still validates.
  const parsed = registerSchema.safeParse(form)
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error).fieldErrors
    fieldErrors.value = {
      displayName: flat.displayName?.[0],
      email: flat.email?.[0],
      password: flat.password?.[0],
    }
    return
  }
  fieldErrors.value = {}
  submitting.value = true
  try {
    await auth.register(parsed.data)
    await router.push('/')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="card narrow">
    <h1>Create account</h1>
    <form novalidate @submit.prevent="submit">
      <label>
        Name
        <input v-model="form.displayName" autocomplete="name" required />
        <small v-if="fieldErrors.displayName" class="error">{{ fieldErrors.displayName }}</small>
      </label>
      <label>
        Email
        <input v-model="form.email" type="email" autocomplete="email" required />
        <small v-if="fieldErrors.email" class="error">{{ fieldErrors.email }}</small>
      </label>
      <label>
        Password
        <input v-model="form.password" type="password" autocomplete="new-password" required />
        <small v-if="fieldErrors.password" class="error">{{ fieldErrors.password }}</small>
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="submitting">
        {{ submitting ? 'Creating…' : 'Create account' }}
      </button>
    </form>
    <p class="muted">Have an account? <RouterLink to="/login">Sign in</RouterLink></p>
  </section>
</template>
