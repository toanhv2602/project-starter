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

/** Remove all rows between tests. Add new tables here as modules grow. */
export async function resetDatabase(app: NestFastifyApplication): Promise<void> {
  const prisma = app.get(PrismaService)
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
