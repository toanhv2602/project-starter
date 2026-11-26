import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { InjectEnv } from '../../config/config.module'
import { type Env } from '../../config/env'
import { createPrismaAdapter } from './prisma-adapter'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@InjectEnv() env: Env) {
    super({ adapter: createPrismaAdapter(env.DATABASE_URL) })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
