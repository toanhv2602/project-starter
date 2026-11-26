import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { type Role } from '@prisma/client'
import { createHmac, randomBytes } from 'node:crypto'
import { InjectEnv } from '../../config/config.module'
import { durationToSeconds, type Env } from '../../config/env'
import { type AccessTokenClaims } from './auth.types'

@Injectable()
export class TokenService {
  readonly accessTtlSeconds: number
  readonly refreshTtlMs: number

  constructor(
    private readonly jwt: JwtService,
    @InjectEnv() private readonly env: Env,
  ) {
    this.accessTtlSeconds = durationToSeconds(env.JWT_ACCESS_TTL)
    this.refreshTtlMs = env.JWT_REFRESH_TTL_DAYS * 86_400_000
  }

  issueAccessToken(userId: string, role: Role): Promise<string> {
    const claims: AccessTokenClaims = { sub: userId, role, typ: 'access' }
    return this.jwt.signAsync(claims, { expiresIn: this.accessTtlSeconds })
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
    try {
      const claims = await this.jwt.verifyAsync<AccessTokenClaims>(token)
      return claims.typ === 'access' ? claims : null
    } catch {
      return null
    }
  }

  /** Opaque, high-entropy refresh token. Only its HMAC is stored. */
  createRefreshToken(): string {
    return randomBytes(48).toString('base64url')
  }

  hashRefreshToken(token: string): string {
    return createHmac('sha256', this.env.JWT_REFRESH_SECRET).update(token).digest('hex')
  }
}
