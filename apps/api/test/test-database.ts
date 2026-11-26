import { loadEnvFile } from '../src/config/load-env-file'

/**
 * Integration tests run against real PostgreSQL in a dedicated `test` schema, so they
 * never touch development data. CI provides DATABASE_URL directly.
 */
export function testDatabaseUrl(): string {
  loadEnvFile()
  const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
  if (!base) throw new Error('DATABASE_URL (or TEST_DATABASE_URL) must be set for tests')
  const url = new URL(base)
  url.searchParams.set('schema', 'test')
  return url.toString()
}
