<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const queryClient = useQueryClient()

async function signOut(): Promise<void> {
  await auth.logout()
  queryClient.clear()
  await router.push({ name: 'login' })
}
</script>

<template>
  <header class="topbar">
    <RouterLink to="/" class="brand">Full Node Starter</RouterLink>
    <nav v-if="auth.isAuthenticated" class="nav">
      <span class="muted">{{ auth.user?.displayName }}</span>
      <button type="button" class="link" @click="signOut">Sign out</button>
    </nav>
  </header>
  <main class="page">
    <RouterView />
  </main>
</template>
