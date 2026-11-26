<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { errorMessage, unwrap } from '@/lib/errors'

// Server state goes through TanStack Query (caching, retries, loading/error states).
const me = useQuery({
  queryKey: ['auth', 'me'],
  queryFn: async () => unwrap(await api.GET('/api/v1/auth/me')),
})
</script>

<template>
  <section class="card">
    <p class="eyebrow">DASHBOARD</p>
    <p v-if="me.isPending.value" class="muted">Loading…</p>
    <p v-else-if="me.isError.value" class="error" role="alert">
      {{ errorMessage(me.error.value) }}
    </p>
    <template v-else-if="me.data.value">
      <h1>Welcome, {{ me.data.value.displayName }}</h1>
      <p class="muted">Signed in as {{ me.data.value.email }} ({{ me.data.value.role }})</p>
    </template>
  </section>
</template>
