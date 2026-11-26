import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { z } from 'zod'

/** Load the monorepo root .env in development (no-op in containers). */
export function loadEnvFile(startDir: string = process.cwd()): void {
  let dir = startDir
  for (;;) {
    const candidate = join(dir, '.env')
    if (existsSync(candidate)) return process.loadEnvFile(candidate)
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return
    const parent = dirname(dir)
    if (parent === dir) return
    dir = parent
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  REDIS_URL: z.string().url(),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(100).default(5),
})
export type WorkerEnv = z.infer<typeof envSchema>

export function parseEnv(source: NodeJS.ProcessEnv = process.env): WorkerEnv {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    throw new Error(`Invalid environment configuration:\n${issues.join('\n')}`)
  }
  return result.data
}
