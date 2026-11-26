import { describe, expect, it } from 'vitest'
import { durationToSeconds, parseEnv } from './env'

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
}

describe('parseEnv', () => {
  it('applies defaults', () => {
    const env = parseEnv(valid)
    expect(env.API_PORT).toBe(3000)
    expect(env.COOKIE_SECURE).toBe(true)
    expect(env.WEB_ORIGIN).toEqual(['http://localhost:5173'])
  })

  it('rejects short or identical secrets', () => {
    expect(() => parseEnv({ ...valid, JWT_ACCESS_SECRET: 'short' })).toThrow(/JWT_ACCESS_SECRET/)
    expect(() => parseEnv({ ...valid, JWT_REFRESH_SECRET: valid.JWT_ACCESS_SECRET })).toThrow(
      /must be different/,
    )
  })

  it('converts durations', () => {
    expect(durationToSeconds('15m')).toBe(900)
    expect(durationToSeconds('1d')).toBe(86_400)
  })
})
