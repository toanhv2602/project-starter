import { EMAIL_JOBS, welcomeEmailJobSchema } from '@app/contracts'
import { type Job, UnrecoverableError } from 'bullmq'
import { type Logger } from '../logger'

/**
 * Jobs must be idempotent: BullMQ retries failed jobs and may deliver a job twice.
 * Validate payloads with the shared contract; invalid payloads are not retried.
 */
export function createEmailProcessor(logger: Logger) {
  return async (job: Job): Promise<void> => {
    switch (job.name) {
      case EMAIL_JOBS.welcome: {
        const parsed = welcomeEmailJobSchema.safeParse(job.data)
        if (!parsed.success) throw new UnrecoverableError('Invalid welcome email payload')
        // TODO: send through your email provider (SES, Postmark, SMTP/Mailpit in dev).
        logger.info({ jobId: job.id, userId: parsed.data.userId }, 'Welcome email sent')
        return
      }
      default:
        throw new UnrecoverableError(`Unknown email job: ${job.name}`)
    }
  }
}
