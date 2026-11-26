import { SetMetadata } from '@nestjs/common'
import { type Role } from '@prisma/client'

export const ROLES_KEY = 'roles'

/** Restrict a route to the given roles (checked by RolesGuard after JwtAuthGuard). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
