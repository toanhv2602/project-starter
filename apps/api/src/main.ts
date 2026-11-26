import 'reflect-metadata'
import { loadEnvFile } from './config/load-env-file'

// Load the root .env before anything reads process.env (no-op in containers).
loadEnvFile()

async function main(): Promise<void> {
  const { createApp } = await import('./bootstrap.js')
  const { ENV } = await import('./config/config.module.js')
  const app = await createApp()
  const { API_PORT } = app.get<{ API_PORT: number }>(ENV)
  await app.listen(API_PORT, '0.0.0.0')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
