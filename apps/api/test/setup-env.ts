import 'reflect-metadata'
import { testDatabaseUrl } from './test-database'

process.env.DATABASE_URL = testDatabaseUrl()
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = process.env.TEST_LOG_LEVEL ?? 'fatal'
process.env.SWAGGER_ENABLED = 'false'
process.env.COOKIE_SECURE = 'false'
process.env.RATE_LIMIT_PER_MINUTE = '10000'
process.env.RATE_LIMIT_AUTH_PER_MINUTE = '10000'
// Use Redis DB 15 so test jobs never reach the dev worker (which listens on DB 0).
const redisUrl = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379')
redisUrl.pathname = '/15'
process.env.REDIS_URL = redisUrl.toString()
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-at-least-32-characters'
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-at-least-32-characters'
