import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import { type FastifyRequest } from 'fastify'
import { type AuthenticatedUser } from '../../modules/auth/auth.types'

/** Inject the authenticated principal set by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>()
    if (!request.user) throw new Error('CurrentUser used on a route without authentication')
    return request.user
  },
)
