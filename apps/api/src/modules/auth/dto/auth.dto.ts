import { authResponseSchema, loginSchema, registerSchema, userSchema } from '@app/contracts'
import { createZodDto } from 'nestjs-zod'

// DTO classes are generated from the shared Zod contracts: one source of truth for
// validation (API), types (web) and OpenAPI docs.
export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class AuthResponseDto extends createZodDto(authResponseSchema) {}
export class UserDto extends createZodDto(userSchema) {}
