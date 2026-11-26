import { QUEUES } from '@app/contracts'
import { Worker } from 'bullmq'
import { loadEnvFile, parseEnv } from './env'
import { createLogger } from './logger'
import { createEmailProcessor } from './processors/email.processor'

loadEnvFile()
const env = parseEnv()
const logger = createLogger(env.LOG_LEVEL, env.NODE_ENV === 'development')

function redisConnection(url: string) {
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

// One Worker per queue. Register new queues/processors here.
const workers = [
  new Worker(QUEUES.email, createEmailProcessor(logger), {
    connection: redisConnection(env.REDIS_URL),
    concurrency: env.WORKER_CONCURRENCY,
  }),
]

for (const worker of workers) {
  worker.on('failed', (job, error) => {
    logger.error(
      { queue: worker.name, jobId: job?.id, attempts: job?.attemptsMade, err: error },
      'Job failed',
    )
  })
  worker.on('error', (error) => logger.error({ queue: worker.name, err: error }, 'Worker error'))
}
logger.info({ queues: workers.map((w) => w.name) }, 'Worker started')

let shuttingDown = false
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'Shutting down: waiting for active jobs to finish')
  const timer = setTimeout(() => {
    logger.error('Graceful shutdown timed out')
    process.exit(1)
  }, 30_000)
  await Promise.all(workers.map((worker) => worker.close()))
  clearTimeout(timer)
  process.exit(0)
}
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
