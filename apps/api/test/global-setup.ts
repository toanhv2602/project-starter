import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { testDatabaseUrl } from './test-database'

/** Recreate the test schema from migrations once per test run. */
export default function setup(): void {
  execSync('pnpm exec prisma migrate reset --force --skip-seed --skip-generate', {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'pipe',
  })
}
