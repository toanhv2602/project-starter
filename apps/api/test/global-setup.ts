import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { testDatabaseUrl } from './test-database'

/**
 * Apply migrations to the dedicated `test` schema once per run. `migrate deploy` is
 * non-destructive; tests isolate themselves by truncating tables (see resetDatabase).
 * If you rewrote a local migration and deploy fails, drop the `test` schema manually.
 */
export default function setup(): void {
  execSync('pnpm exec prisma migrate deploy', {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'pipe',
  })
}
