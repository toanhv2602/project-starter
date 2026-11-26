/**
 * Export the OpenAPI document without a database or Redis: `pnpm api:generate`.
 * Preview mode builds the module graph without instantiating providers.
 */
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { type NestFastifyApplication } from '@nestjs/platform-fastify'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { AppModule } from './app.module'
import { API_PREFIX, buildOpenApiDocument, createFastifyAdapter } from './bootstrap'

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, createFastifyAdapter(), {
    preview: true,
    logger: false,
  })
  app.setGlobalPrefix(API_PREFIX)
  const document = buildOpenApiDocument(app)
  const output = resolve(__dirname, '../../../packages/api-client/openapi.json')
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`)
  await app.close()
  console.warn(`OpenAPI document written to ${output}`)
}

void exportOpenApi()
