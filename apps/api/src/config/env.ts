import { z } from 'zod'

// Zod 4: .default() skips transforms, so the default is applied before the transform.
const booleanString = (fallback: 'true' | 'false') =>
  z
    .enum(['true', 'false', '1', '0'])
    .default(fallback)
    .transform((value) => value === 'true' || value === '1')

const secret = z.string().min(32, 'must be at least 32 characters')

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    API_PORT: z.coerce.number().int().positive().default(3000),
    WEB_ORIGIN: z
      .string()
      .default('http://localhost:5173')
      .transform((value) => value.split(',').map((origin) => origin.trim())),
    SWAGGER_ENABLED: booleanString('false'),
    COOKIE_SECURE: booleanString('true'),
    TRUST_PROXY: z
      .string()
      .default('false')
      // "true", "false", or a comma-separated list of proxy IPs/CIDRs (e.g. "10.0.0.0/8").
      .transform((value) => (value === 'true' ? true : value === 'false' ? false : value)),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    JWT_ACCESS_SECRET: secret,
    JWT_REFRESH_SECRET: secret,
    JWT_ACCESS_TTL: z
      .string()
      .regex(/^\d+[smhd]$/, 'use a duration such as 15m')
      .default('15m'),
    JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
    RATE_LIMIT_AUTH_PER_MINUTE: z.coerce.number().int().positive().default(10),
  })
  .refine((env) => env.JWT_ACCESS_SECRET !== env.JWT_REFRESH_SECRET, {
    message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    path: ['JWT_REFRESH_SECRET'],
  })

export type Env = z.infer<typeof envSchema>

/** Parse and validate process.env. Fails fast with a readable message. */
export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }
  return result.data
}

/** Convert "15m" style durations to seconds. */
export function durationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration)
  if (!match) throw new Error(`Invalid duration: ${duration}`)
  const value = Number(match[1])
  const unit = { s: 1, m: 60, h: 3600, d: 86_400 }[match[2] as 's' | 'm' | 'h' | 'd']
  return value * unit
}
