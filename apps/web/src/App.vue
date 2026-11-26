<script setup lang="ts">
import { ref } from 'vue'

const apiStatus = ref('Not checked')

async function checkApi() {
  apiStatus.value = 'Checking...'
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/api/v1/health`,
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    apiStatus.value = 'API is healthy'
  } catch {
    apiStatus.value = 'API unavailable'
  }
}
</script>

<template>
  <main class="container">
    <p class="eyebrow">FULL NODE STARTER</p>
    <h1>Vue 3 + NestJS</h1>
    <p class="muted">Your Modular Monolith workspace is ready to extend.</p>
    <button type="button" @click="checkApi">Check API health</button>
    <p class="status" role="status">{{ apiStatus }}</p>
  </main>
</template>
