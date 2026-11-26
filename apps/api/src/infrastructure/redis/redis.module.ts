import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import IORedis, { type Redis } from 'ioredis'
import { ENV } from '../../config/config.module'
import { type Env } from '../../config/env'
import { redisOptionsFromUrl } from './redis-options'

/** General-purpose Redis client (cache, health checks). Queues use their own connections. */
export const REDIS = Symbol('REDIS')
export const InjectRedis = () => Inject(REDIS)

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ENV],
      useFactory: (env: Env): Redis => new IORedis(redisOptionsFromUrl(env.REDIS_URL)),
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationShutdown(): Promise<void> {
    const redis = this.moduleRef.get<Redis>(REDIS)
    if (redis.status !== 'end') await redis.quit()
  }
}
