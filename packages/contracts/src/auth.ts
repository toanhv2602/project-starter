import { z } from 'zod'

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(320))

// NIST 800-63B: length matters more than composition rules.
export const passwordSchema = z.string().min(12, 'Password must be at least 12 characters').max(128)

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(100),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
})
export type LoginInput = z.infer<typeof loginSchema>

export const userSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  displayName: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.iso.datetime(),
})
export type User = z.infer<typeof userSchema>

export const authResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int().describe('Access token lifetime in seconds'),
  user: userSchema,
})
export type AuthResponse = z.infer<typeof authResponseSchema>
