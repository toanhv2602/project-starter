import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Read VITE_* variables from the monorepo root .env.
  envDir: '../..',
  server: {
    port: 5173,
    // Same-origin in dev: the browser calls /api and Vite forwards it, so the refresh
    // cookie (SameSite=Strict) works and CORS is not involved. nginx does the same in prod.
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
        changeOrigin: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
