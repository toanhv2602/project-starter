import { defineConfig, devices } from '@playwright/test'

/**
 * Critical user journeys against the real stack (web + api + worker + Postgres + Redis).
 * Run `pnpm infra:up && pnpm db:migrate:deploy` first. Playwright starts `pnpm dev` itself
 * (or reuses one that is already running).
 *
 * Browsers: CI installs Chromium (`pnpm exec playwright install --with-deps chromium`).
 * Locally you can use an installed browser instead: PW_CHANNEL=msedge or PW_CHANNEL=chrome.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev',
        cwd: '..',
        // Wait for the API through the Vite proxy, not just Vite: the API starts slower.
        url: `${baseURL}/api/v1/health/ready`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
})
