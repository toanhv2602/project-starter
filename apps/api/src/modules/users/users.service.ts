import { Injectable } from '@nestjs/common'
import { type User as UserDto } from '@app/contracts'
import { type Prisma, type User } from '@prisma/client'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'

/**
 * Public interface of the users module. Other modules must use this service,
 * never Prisma's `user` delegate directly.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  }

  create(data: Pick<Prisma.UserCreateInput, 'email' | 'passwordHash' | 'displayName'>) {
    return this.prisma.user.create({ data: { ...data, email: data.email.toLowerCase() } })
  }

  /** Map the persistence model to the public API contract (never leak passwordHash). */
  static toDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }
  }
}
