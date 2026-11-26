import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { type ApiError } from '@app/contracts'
import { Prisma } from '@prisma/client'
import { type FastifyReply, type FastifyRequest } from 'fastify'
import { ZodValidationException } from 'nestjs-zod'
import { z } from 'zod'

const STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
}

/**
 * Converts every error into the shared `ApiError` shape. Unknown errors are logged
 * with full detail but returned to the client as a generic 500 (no stack traces).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<FastifyRequest>()
    const reply = ctx.getResponse<FastifyReply>()
    const body = this.toApiError(exception)
    body.requestId = String(request.id)

    if (body.statusCode >= 500) {
      this.logger.error({ err: exception, requestId: body.requestId }, 'Unhandled error')
    }
    void reply.status(body.statusCode).send(body)
  }

  private toApiError(exception: unknown): ApiError {
    if (exception instanceof ZodValidationException) {
      return {
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        details: z.flattenError(exception.getZodError() as z.ZodError),
      }
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus()
      const response = exception.getResponse()
      const payload = typeof response === 'object' && response !== null ? response : {}
      const code = 'code' in payload && typeof payload.code === 'string' ? payload.code : undefined
      const message =
        'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : exception.message
      const details = 'details' in payload ? payload.details : undefined
      return {
        statusCode,
        code: code ?? STATUS_CODES[statusCode] ?? 'ERROR',
        message,
        ...(details === undefined ? {} : { details }),
      }
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return { statusCode: 409, code: 'CONFLICT', message: 'Resource already exists' }
      }
      if (exception.code === 'P2025') {
        return { statusCode: 404, code: 'NOT_FOUND', message: 'Resource not found' }
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    }
  }
}
