import 'reflect-metadata'
import { testDatabaseUrl } from './test-database'

process.env.DATABASE_URL = testDatabaseUrl()
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = process.env.TEST_LOG_LEVEL ?? 'fatal'
process.env.SWAGGER_ENABLED = 'false'
process.env.COOKIE_SECURE = 'false'
process.env.RATE_LIMIT_PER_MINUTE = '10000'
process.env.RATE_LIMIT_AUTH_PER_MINUTE = '10000'
process.env.REDIS_URL ??= 'redis://localhost:6379'
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-at-least-32-characters'
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-at-least-32-characters'
