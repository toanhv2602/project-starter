import { type Role } from '@prisma/client'

export interface AccessTokenClaims {
  sub: string
  role: Role
  typ: 'access'
}

/** The principal attached to `request.user` by JwtAuthGuard. */
export interface AuthenticatedUser {
  id: string
  role: Role
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }
}
