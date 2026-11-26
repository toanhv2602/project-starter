import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Prisma 7 connects through the `pg` driver adapter. `pg` ignores the `?schema=` URL parameter
 * that Prisma 6 used, so it is translated here into:
 * - the adapter `schema` option (Prisma's own queries), and
 * - the session `search_path` (raw SQL and `current_schema()`, e.g. resetDatabase() in tests).
 */
export function createPrismaAdapter(databaseUrl: string): PrismaPg {
  const url = new URL(databaseUrl)
  const schema = url.searchParams.get('schema')
  url.searchParams.delete('schema')
  if (!schema) return new PrismaPg({ connectionString: url.toString() })
  if (!/^\w+$/.test(schema)) throw new Error(`Invalid database schema name "${schema}"`)
  return new PrismaPg(
    { connectionString: url.toString(), options: `-c search_path=${schema}` },
    { schema },
  )
}
