/**
 * Connection settings parsed from a redis:// or rediss:// URL.
 * Plain object accepted by both ioredis (`new Redis(options)`) and BullMQ (`connection`),
 * which have separate option types since BullMQ 6. BullMQ owns its own connections.
 */
export interface RedisConnectionSettings {
  host: string
  port: number
  username?: string
  password?: string
  db: number
  tls?: Record<string, never>
  maxRetriesPerRequest: null
}

export function redisOptionsFromUrl(url: string): RedisConnectionSettings {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    db: parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : 0,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  }
}
