import { Test } from '@nestjs/testing'
import { type NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from '../src/app.module'
import { configureApp, createFastifyAdapter } from '../src/bootstrap'
import { PrismaService } from '../src/infrastructure/prisma/prisma.service'

/** Boot the real application (real Postgres + Redis) for HTTP-level tests via app.inject(). */
export async function createTestApp(): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = moduleRef.createNestApplication<NestFastifyApplication>(createFastifyAdapter())
  await configureApp(app)
  await app.init()
  await app.getHttpAdapter().getInstance().ready()
  return app
}

/** Remove all rows in the `test` schema between tests. */
export async function resetDatabase(app: NestFastifyApplication): Promise<void> {
  const prisma = app.get(PrismaService)
  // Safety net: never truncate anything but the dedicated test schema (e.g. dev data in public).
  const [row] = await prisma.$queryRaw<{ schema: string }[]>`SELECT current_schema() AS schema`
  if (row?.schema !== 'test') {
    throw new Error(`resetDatabase refused: current schema is "${row?.schema}", expected "test"`)
  }
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'`
  if (tables.length === 0) return
  const list = tables.map((t) => `"${t.tablename}"`).join(', ')
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`)
}

/** Extract the refresh cookie value from a Set-Cookie header. */
export function refreshCookieFrom(setCookie: string | string[] | undefined): string | undefined {
  const headers = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : []
  for (const header of headers) {
    const match = /^refresh_token=([^;]*)/.exec(header)
    if (match?.[1]) return match[1]
  }
  return undefined
}

let userCounter = 0

/** Register a fresh user and return an Authorization header for it. */
export async function signUp(
  app: NestFastifyApplication,
  overrides: Partial<{ email: string; password: string; displayName: string }> = {},
): Promise<{ userId: string; headers: { authorization: string } }> {
  userCounter += 1
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      email: `user${userCounter}-${Date.now()}@example.com`,
      password: 'correct-horse-battery-staple',
      displayName: `User ${userCounter}`,
      ...overrides,
    },
  })
  if (res.statusCode !== 201) throw new Error(`signUp failed: ${res.statusCode} ${res.body}`)
  const body = res.json<{ accessToken: string; user: { id: string } }>()
  return { userId: body.user.id, headers: { authorization: `Bearer ${body.accessToken}` } }
}
