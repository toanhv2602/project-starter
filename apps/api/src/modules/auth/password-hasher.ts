import { Injectable } from '@nestjs/common'
import * as argon2 from 'argon2'

/** Argon2id with OWASP-recommended parameters (19 MiB, 2 iterations). */
@Injectable()
export class PasswordHasher {
  private readonly options = {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  } as const

  // Used to keep login timing similar whether or not the account exists.
  private dummyHash: Promise<string> | undefined

  hash(password: string): Promise<string> {
    return argon2.hash(password, this.options)
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password)
    } catch {
      return false
    }
  }

  async verifyDummy(password: string): Promise<false> {
    this.dummyHash ??= this.hash('dummy-password-for-timing-safety')
    await this.verify(await this.dummyHash, password)
    return false
  }
}
