import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { QUEUES } from '@app/contracts'
import { Queue } from 'bullmq'
import { ENV } from '../../config/config.module'
import { type Env } from '../../config/env'
import { redisOptionsFromUrl } from '../redis/redis-options'

export const EMAIL_QUEUE = Symbol('EMAIL_QUEUE')
export const InjectEmailQueue = () => Inject(EMAIL_QUEUE)

/**
 * Producers for background jobs. The worker app (apps/worker) consumes them.
 * Default job options: retries with exponential backoff, bounded history.
 */
@Global()
@Module({
  providers: [
    {
      provide: EMAIL_QUEUE,
      inject: [ENV],
      useFactory: (env: Env) =>
        new Queue(QUEUES.email, {
          connection: redisOptionsFromUrl(env.REDIS_URL),
          defaultJobOptions: {
            attempts: 5,
            backoff: { type: 'exponential', delay: 5_000 },
            removeOnComplete: { age: 24 * 3600, count: 1000 },
            removeOnFail: { age: 7 * 24 * 3600 },
          },
        }),
    },
  ],
  exports: [EMAIL_QUEUE],
})
export class QueueModule implements OnApplicationShutdown {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationShutdown(): Promise<void> {
    await this.moduleRef.get<Queue>(EMAIL_QUEUE).close()
  }
}
