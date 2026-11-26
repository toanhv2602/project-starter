import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import { ApiBearerAuth, ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { type AuthResponse, type User } from '@app/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { InjectEnv } from '../../config/config.module'
import { type Env } from '../../config/env'
import { UsersService } from '../users/users.service'
import { AuthService, type SessionResult } from './auth.service'
import { type AuthenticatedUser } from './auth.types'
import { AuthResponseDto, LoginDto, RegisterDto, UserDto } from './dto/auth.dto'

export const REFRESH_COOKIE = 'refresh_token'
const REFRESH_COOKIE_PATH = '/api/v1/auth'

// Stricter rate limit for credential endpoints (brute force / credential stuffing).
// The limit is resolved per request, after the environment has been validated.
const authLimit = () => Number(process.env.RATE_LIMIT_AUTH_PER_MINUTE ?? 10)

@ApiTags('auth')
@Throttle({ default: { limit: authLimit, ttl: 60_000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @InjectEnv() private readonly env: Env,
  ) {}

  @Public()
  @Post('register')
  @ApiOkResponse({ type: AuthResponseDto })
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    return this.respond(reply, await this.auth.register(body))
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    return this.respond(reply, await this.auth.login(body))
  }

  /** Uses the HttpOnly refresh cookie; returns a new access token and rotates the cookie. */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    try {
      return this.respond(reply, await this.auth.refresh(request.cookies[REFRESH_COOKIE]))
    } catch (error) {
      this.clearCookie(reply)
      throw error
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.auth.logout(request.cookies[REFRESH_COOKIE])
    this.clearCookie(reply)
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserDto })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return UsersService.toDto(await this.auth.me(user.id))
  }

  private respond(reply: FastifyReply, session: SessionResult): AuthResponse {
    void reply.setCookie(REFRESH_COOKIE, session.refreshToken, {
      httpOnly: true,
      secure: this.env.COOKIE_SECURE,
      // Strict: the browser never sends the cookie on cross-site requests (CSRF defence).
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
      expires: session.refreshExpiresAt,
    })
    return session.response
  }

  private clearCookie(reply: FastifyReply): void {
    void reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH })
  }
}
