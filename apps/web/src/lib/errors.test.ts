import { describe, expect, it } from 'vitest'
import { errorMessage, unwrap } from './errors'

describe('errorMessage', () => {
  it('uses the API error message', () => {
    expect(errorMessage({ statusCode: 409, code: 'EMAIL_TAKEN', message: 'Taken' })).toBe('Taken')
  })
  it('falls back for unknown values', () => {
    expect(errorMessage(42)).toBe('Something went wrong')
  })
})

describe('unwrap', () => {
  it('returns data or throws the error body', () => {
    expect(unwrap({ data: 1 })).toBe(1)
    expect(() => unwrap({ error: { code: 'X' } })).toThrow()
  })
})
