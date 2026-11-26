import { type Job, UnrecoverableError } from 'bullmq'
import pino from 'pino'
import { describe, expect, it } from 'vitest'
import { createEmailProcessor } from './email.processor'

const process = createEmailProcessor(pino({ level: 'silent' }))
const job = (name: string, data: unknown) => ({ id: '1', name, data }) as Job

describe('email processor', () => {
  it('processes a valid welcome job', async () => {
    await expect(
      process(
        job('welcome', {
          userId: '6f1c1c56-6d1e-4c43-9d61-1a2b3c4d5e6f',
          email: 'a@b.co',
          displayName: 'A',
        }),
      ),
    ).resolves.toBeUndefined()
  })

  it('does not retry invalid payloads', async () => {
    await expect(process(job('welcome', { email: 'x' }))).rejects.toBeInstanceOf(UnrecoverableError)
  })

  it('rejects unknown job names', async () => {
    await expect(process(job('nope', {}))).rejects.toBeInstanceOf(UnrecoverableError)
  })
})
