import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * Throw this for expected business errors. `code` is a stable machine-readable
 * identifier the frontend can switch on (e.g. EMAIL_TAKEN); `message` is for humans.
 */
export class AppError extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super({ code, message, details }, status)
  }
}
