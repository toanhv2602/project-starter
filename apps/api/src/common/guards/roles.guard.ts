import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { type Role } from '@prisma/client'
import { type FastifyRequest } from 'fastify'
import { AppError } from '../errors'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!roles || roles.length === 0) return true
    const { user } = context.switchToHttp().getRequest<FastifyRequest>()
    if (user && roles.includes(user.role)) return true
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action')
  }
}
