import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { FastifyReply } from 'fastify'
import { type Redis } from 'ioredis'
import { Public } from '../../common/decorators/public.decorator'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { InjectRedis } from '../../infrastructure/redis/redis.module'

type CheckStatus = 'up' | 'down'

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /** Liveness: the process is running. Never checks dependencies (avoids restart loops). */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'ok' }
  }

  /** Readiness: dependencies are reachable. Returns 503 when the instance should not get traffic. */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (database + redis)' })
  async ready(@Res({ passthrough: true }) reply: FastifyReply) {
    const [database, redis] = await Promise.all([
      this.check(() => this.prisma.$queryRaw`SELECT 1`),
      this.check(() => this.redis.ping()),
    ])
    const ok = database === 'up' && redis === 'up'
    void reply.status(ok ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
    return { status: ok ? 'ok' : 'degraded', checks: { database, redis } }
  }

  private async check(fn: () => Promise<unknown>): Promise<CheckStatus> {
    try {
      await withTimeout(fn(), 2_000)
      return 'up'
    } catch {
      return 'down'
    }
  }
}
