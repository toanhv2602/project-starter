import { Global, Inject, Module } from '@nestjs/common'
import { type Env, parseEnv } from './env'

export const ENV = Symbol('ENV')

/** Inject the validated environment: `constructor(@InjectEnv() env: Env)` */
export const InjectEnv = () => Inject(ENV)

@Global()
@Module({
  providers: [{ provide: ENV, useFactory: (): Env => parseEnv() }],
  exports: [ENV],
})
export class AppConfigModule {}
