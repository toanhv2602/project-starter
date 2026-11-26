import { loadEnvFile } from '../src/config/load-env-file'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres'])

/**
 * Integration tests run against real PostgreSQL in a dedicated `test` schema, so they
 * never touch development data. Tests truncate tables, so they refuse to run against a
 * non-local host unless ALLOW_REMOTE_TEST_DB=true (e.g. an ephemeral CI database).
 */
export function testDatabaseUrl(): string {
  loadEnvFile()
  const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
  if (!base) throw new Error('DATABASE_URL (or TEST_DATABASE_URL) must be set for tests')
  const url = new URL(base)
  if (!LOCAL_HOSTS.has(url.hostname) && process.env.ALLOW_REMOTE_TEST_DB !== 'true') {
    throw new Error(
      `Refusing to run tests against non-local database host "${url.hostname}". ` +
        'Set ALLOW_REMOTE_TEST_DB=true only for disposable databases.',
    )
  }
  url.searchParams.set('schema', 'test')
  return url.toString()
}
