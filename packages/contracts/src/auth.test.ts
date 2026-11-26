import { describe, expect, it } from 'vitest'
import { registerSchema } from './auth'

describe('registerSchema', () => {
  it('normalises email', () => {
    const parsed = registerSchema.parse({
      email: '  Alice@Example.COM ',
      password: 'correct-horse-battery',
      displayName: 'Alice',
    })
    expect(parsed.email).toBe('alice@example.com')
  })

  it('rejects short passwords', () => {
    const result = registerSchema.safeParse({
      email: 'a@b.co',
      password: 'short',
      displayName: 'A',
    })
    expect(result.success).toBe(false)
  })
})
