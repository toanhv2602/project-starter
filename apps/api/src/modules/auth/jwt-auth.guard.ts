import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { type FastifyRequest } from 'fastify'
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator'
import { AppError } from '../../common/errors'
import { TokenService } from './token.service'

/** Global guard: every route requires a valid access token unless marked @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const header = request.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
    const claims = token ? await this.tokens.verifyAccessToken(token) : null
    if (!claims) {
      throw new AppError(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', 'Authentication required')
    }
    request.user = { id: claims.sub, role: claims.role }
    return true
  }
}
