import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import {
  type AuthResponse,
  EMAIL_JOBS,
  type LoginInput,
  type RegisterInput,
  type WelcomeEmailJob,
} from '@app/contracts'
import { type User } from '@prisma/client'
import { Queue } from 'bullmq'
import { randomUUID } from 'node:crypto'
import { AppError } from '../../common/errors'
import { InjectEmailQueue } from '../../infrastructure/queue/queue.module'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { PasswordHasher } from './password-hasher'
import { TokenService } from './token.service'

export interface SessionResult {
  response: AuthResponse
  refreshToken: string
  refreshExpiresAt: Date
}

const invalidCredentials = () =>
  new AppError(HttpStatus.UNAUTHORIZED, 'INVALID_CREDENTIALS', 'Invalid email or password')
const invalidSession = () =>
  new AppError(HttpStatus.UNAUTHORIZED, 'INVALID_SESSION', 'Session expired, please sign in again')

class ConcurrentRefreshError extends Error {}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    @InjectEmailQueue() private readonly emailQueue: Queue,
  ) {}

  async register(input: RegisterInput): Promise<SessionResult> {
    if (await this.users.findByEmail(input.email)) {
      throw new AppError(HttpStatus.CONFLICT, 'EMAIL_TAKEN', 'An account with this email exists')
    }
    const user = await this.users.create({
      email: input.email,
      displayName: input.displayName,
      passwordHash: await this.hasher.hash(input.password),
    })
    await this.enqueueWelcomeEmail(user)
    return this.startSession(user, randomUUID())
  }

  async login(input: LoginInput): Promise<SessionResult> {
    const user = await this.users.findByEmail(input.email)
    if (!user) {
      await this.hasher.verifyDummy(input.password)
      throw invalidCredentials()
    }
    const valid = await this.hasher.verify(user.passwordHash, input.password)
    if (!valid || !user.isActive) throw invalidCredentials()
    return this.startSession(user, randomUUID())
  }

  /**
   * Refresh-token rotation with reuse detection:
   * - every refresh revokes the presented token and issues a new one in the same family;
   * - presenting an already-revoked token means it was stolen or replayed, so the whole
   *   family is revoked and the user must sign in again.
   */
  async refresh(rawToken: string | undefined): Promise<SessionResult> {
    if (!rawToken) throw invalidSession()
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.tokens.hashRefreshToken(rawToken) },
      include: { user: true },
    })
    if (!existing) throw invalidSession()

    if (existing.revokedAt) {
      this.logger.warn(
        { userId: existing.userId, familyId: existing.familyId },
        'Refresh token reuse detected',
      )
      await this.revokeFamily(existing.familyId)
      throw invalidSession()
    }
    if (existing.expiresAt <= new Date() || !existing.user.isActive) throw invalidSession()

    try {
      return await this.startSession(existing.user, existing.familyId, existing.id)
    } catch (error) {
      if (error instanceof ConcurrentRefreshError) {
        await this.revokeFamily(existing.familyId)
        throw invalidSession()
      }
      throw error
    }
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.tokens.hashRefreshToken(rawToken) },
      select: { familyId: true },
    })
    if (existing) await this.revokeFamily(existing.familyId)
  }

  async me(userId: string): Promise<User> {
    const user = await this.users.findById(userId)
    if (!user || !user.isActive) throw invalidSession()
    return user
  }

  private async startSession(
    user: User,
    familyId: string,
    rotateFromId?: string,
  ): Promise<SessionResult> {
    const refreshToken = this.tokens.createRefreshToken()
    const refreshExpiresAt = new Date(Date.now() + this.tokens.refreshTtlMs)

    await this.prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({
        data: {
          userId: user.id,
          familyId,
          tokenHash: this.tokens.hashRefreshToken(refreshToken),
          expiresAt: refreshExpiresAt,
        },
      })
      if (rotateFromId) {
        // Conditional update: only one concurrent request can rotate a given token.
        const rotated = await tx.refreshToken.updateMany({
          where: { id: rotateFromId, revokedAt: null },
          data: { revokedAt: new Date(), replacedBy: created.id },
        })
        if (rotated.count !== 1) throw new ConcurrentRefreshError()
      }
    })

    return {
      refreshToken,
      refreshExpiresAt,
      response: {
        accessToken: await this.tokens.issueAccessToken(user.id, user.role),
        expiresIn: this.tokens.accessTtlSeconds,
        user: UsersService.toDto(user),
      },
    }
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  private async enqueueWelcomeEmail(user: User): Promise<void> {
    const payload: WelcomeEmailJob = {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
    }
    try {
      // A fixed jobId makes the enqueue idempotent.
      await this.emailQueue.add(EMAIL_JOBS.welcome, payload, { jobId: `welcome-${user.id}` })
    } catch (error) {
      // Registration must not fail because the queue is down. For guaranteed delivery,
      // replace this with a transactional outbox table.
      this.logger.error({ err: error, userId: user.id }, 'Failed to enqueue welcome email')
    }
  }
}
