import { expect, test } from '@playwright/test'

test('a new user can register, keeps the session on reload and can sign out', async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`

  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)

  await page.getByRole('link', { name: 'Create one' }).click()
  await page.getByLabel('Name').fill('E2E User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('e2e-password-123')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('heading', { name: 'Welcome, E2E User' })).toBeVisible()

  // Access token is in memory only: a reload must restore it from the refresh cookie.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Welcome, E2E User' })).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})

test('shows a generic error for wrong credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('nobody@example.com')
  await page.getByLabel('Password').fill('wrong-password-123')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toHaveText('Invalid email or password')
})
