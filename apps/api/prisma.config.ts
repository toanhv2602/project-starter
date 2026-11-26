import { defineConfig } from 'prisma/config'

// Prisma 7 reads connection settings from here, not from schema.prisma.
// DATABASE_URL comes from the root .env (scripts use dotenv-cli) or the container environment.
// `prisma generate` does not need a database, so a missing URL is allowed here.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
})
