import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { randomBytes, createHash } from 'node:crypto'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issueAccessToken(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId, typ: 'access' })
  }

  /**
   * Generate opaque refresh token material.
   * Persist only hashRefreshToken(token) in the RefreshToken table.
   * Rotation/reuse detection and transactional persistence must be implemented
   * by the auth use case before exposing a public refresh endpoint.
   */
  createRefreshToken(): string {
    return randomBytes(48).toString('base64url')
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256')
      .update(token + this.config.getOrThrow<string>('JWT_REFRESH_SECRET'))
      .digest('hex')
  }
}
