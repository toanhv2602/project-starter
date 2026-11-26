/**
 * Development seed: `pnpm db:seed`. Idempotent (upsert). Never run against production.
 */
import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'
import { createPrismaAdapter } from '../src/infrastructure/prisma/prisma-adapter'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL must be set')
const prisma = new PrismaClient({ adapter: createPrismaAdapter(databaseUrl) })

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed a production database')
  }
  const email = 'admin@example.com'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-admin-password'
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      displayName: 'Admin',
      role: 'ADMIN',
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
    },
  })
  console.warn(`Seeded ${email} (password from SEED_ADMIN_PASSWORD or the default in seed.ts)`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => void prisma.$disconnect())
