import fastifyCookie from '@fastify/cookie'
import fastifyHelmet from '@fastify/helmet'
import { type INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { randomUUID } from 'node:crypto'
import { type IncomingMessage } from 'node:http'
import { AppModule } from './app.module'
import { ENV } from './config/config.module'
import { type Env, parseEnv } from './config/env'

export const API_PREFIX = 'api/v1'
const REQUEST_ID_PATTERN = /^[\w-]{8,64}$/

export function createFastifyAdapter(trustProxy: boolean | string = false): FastifyAdapter {
  return new FastifyAdapter({
    trustProxy,
    bodyLimit: 1024 * 1024,
    // Reuse a well-formed incoming X-Request-Id, otherwise generate one. Stored on the raw
    // request too so pino-http logs the same id.
    genReqId: (req: IncomingMessage) => {
      const header = req.headers['x-request-id']
      const id =
        typeof header === 'string' && REQUEST_ID_PATTERN.test(header) ? header : randomUUID()
      Object.assign(req, { id })
      return id
    },
  })
}

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Full Node Starter API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addCookieAuth('refresh_token')
    .build()
  // cleanupOpenApiDoc turns the Zod-generated DTO schemas into valid OpenAPI.
  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config))
}

/** Apply all cross-cutting HTTP configuration. Shared by main.ts and integration tests. */
export async function configureApp(app: NestFastifyApplication): Promise<NestFastifyApplication> {
  const env = app.get<Env>(ENV)

  app.useLogger(app.get(Logger))
  app.setGlobalPrefix(API_PREFIX)
  app.enableShutdownHooks()
  app.enableCors({ origin: env.WEB_ORIGIN, credentials: true })

  await app.register(fastifyCookie)
  await app.register(fastifyHelmet, {
    // Swagger UI needs inline scripts; the API itself only serves JSON.
    contentSecurityPolicy: env.SWAGGER_ENABLED ? false : undefined,
  })
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', async (request, reply) => {
      void reply.header('x-request-id', request.id)
    })

  if (env.SWAGGER_ENABLED) {
    SwaggerModule.setup('docs', app, buildOpenApiDocument(app))
  }
  return app
}

export async function createApp(): Promise<NestFastifyApplication> {
  const adapter = createFastifyAdapter(parseEnv().TRUST_PROXY)
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  })
  return configureApp(app)
}
