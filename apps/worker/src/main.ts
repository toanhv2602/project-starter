import { Worker } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const worker = new Worker(
  'starter-jobs',
  async (job) => {
    console.info({ jobId: job.id, name: job.name }, 'Processing starter job')
    // Register domain processors here. Keep jobs idempotent.
  },
  { connection },
)

worker.on('failed', (job, error) => {
  console.error({ jobId: job?.id, error }, 'Background job failed')
})

const shutdown = async () => {
  await worker.close()
  await connection.quit()
}
process.on('SIGTERM', () => void shutdown())
process.on('SIGINT', () => void shutdown())
