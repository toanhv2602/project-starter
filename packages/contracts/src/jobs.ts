import { z } from 'zod'

/** Queue names shared by the API (producer) and the worker (consumer). */
export const QUEUES = {
  email: 'email',
} as const
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES]

export const welcomeEmailJobSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  displayName: z.string(),
})
export type WelcomeEmailJob = z.infer<typeof welcomeEmailJobSchema>

export const EMAIL_JOBS = {
  welcome: 'welcome',
} as const
