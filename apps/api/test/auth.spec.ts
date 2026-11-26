import { type NestFastifyApplication } from '@nestjs/platform-fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, refreshCookieFrom, resetDatabase } from './test-app'

const credentials = {
  email: 'alice@example.com',
  password: 'correct-horse-battery-staple',
  displayName: 'Alice',
}

describe('Auth (integration)', () => {
  let app: NestFastifyApplication

  beforeAll(async () => {
    app = await createTestApp()
  })
  afterAll(async () => {
    await app.close()
  })
  beforeEach(async () => {
    await resetDatabase(app)
  })

  const register = (body: object = credentials) =>
    app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: body })
  const refresh = (token: string) =>
    app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: { refresh_token: token },
    })

  it('registers, sets an HttpOnly refresh cookie and never returns the password hash', async () => {
    const res = await register()
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.user).toMatchObject({ email: credentials.email, role: 'USER' })
    expect(body.user.passwordHash).toBeUndefined()
    expect(body.accessToken).toEqual(expect.any(String))
    const cookie = String(res.headers['set-cookie'])
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Strict')
    expect(cookie).toContain('Path=/api/v1/auth')
  })

  it('rejects invalid input with VALIDATION_FAILED', async () => {
    const res = await register({ email: 'not-an-email', password: 'short', displayName: '' })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ code: 'VALIDATION_FAILED', requestId: expect.any(String) })
  })

  it('rejects a duplicate email with EMAIL_TAKEN', async () => {
    await register()
    const res = await register({ ...credentials, email: 'ALICE@example.com' })
    expect(res.statusCode).toBe(409)
    expect(res.json().code).toBe('EMAIL_TAKEN')
  })

  it('logs in and rejects wrong passwords with a generic error', async () => {
    await register()
    const ok = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: credentials.email, password: credentials.password },
    })
    expect(ok.statusCode).toBe(200)

    const wrong = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: credentials.email, password: 'wrong-password-123' },
    })
    const unknown = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'nobody@example.com', password: 'wrong-password-123' },
    })
    expect(wrong.statusCode).toBe(401)
    expect(unknown.statusCode).toBe(401)
    expect(wrong.json().code).toBe(unknown.json().code)
  })

  it('protects /me and accepts a valid access token', async () => {
    const { accessToken } = (await register()).json()
    const anonymous = await app.inject({ method: 'GET', url: '/api/v1/auth/me' })
    expect(anonymous.statusCode).toBe(401)

    const me = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(me.statusCode).toBe(200)
    expect(me.json().email).toBe(credentials.email)
  })

  it('rotates refresh tokens and revokes the family when an old token is reused', async () => {
    const first = refreshCookieFrom((await register()).headers['set-cookie'])!

    const rotated = await refresh(first)
    expect(rotated.statusCode).toBe(200)
    const second = refreshCookieFrom(rotated.headers['set-cookie'])!
    expect(second).not.toBe(first)

    // Replaying the first token is treated as theft...
    const replay = await refresh(first)
    expect(replay.statusCode).toBe(401)
    // ...and the legitimate newer token is revoked as well.
    const afterReuse = await refresh(second)
    expect(afterReuse.statusCode).toBe(401)
  })

  it('logout revokes the session', async () => {
    const token = refreshCookieFrom((await register()).headers['set-cookie'])!
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      cookies: { refresh_token: token },
    })
    expect(res.statusCode).toBe(204)
    expect((await refresh(token)).statusCode).toBe(401)
  })
})

describe('Health (integration)', () => {
  let app: NestFastifyApplication
  beforeAll(async () => {
    app = await createTestApp()
  })
  afterAll(async () => {
    await app.close()
  })

  it('reports liveness and readiness', async () => {
    expect((await app.inject({ url: '/api/v1/health/live' })).statusCode).toBe(200)
    const ready = await app.inject({ url: '/api/v1/health/ready' })
    expect(ready.statusCode).toBe(200)
    expect(ready.json().checks).toEqual({ database: 'up', redis: 'up' })
  })

  it('returns a request id header', async () => {
    const res = await app.inject({
      url: '/api/v1/health/live',
      headers: { 'x-request-id': 'test-request-123' },
    })
    expect(res.headers['x-request-id']).toBe('test-request-123')
  })
})
