#!/usr/bin/env node
/**
 * First-run setup: `pnpm onboard`
 * (Not named "setup": `pnpm setup` is a built-in pnpm command that edits your PATH.)
 * - checks the Node.js version against .nvmrc
 * - creates .env from .env.example with freshly generated secrets
 * - picks free local ports for Postgres/Redis if the defaults are taken
 * Safe to re-run: an existing .env is never overwritten.
 */
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env')
const examplePath = join(root, '.env.example')

function checkNode() {
  const wanted = Number(readFileSync(join(root, '.nvmrc'), 'utf8').trim())
  const [major] = process.versions.node.split('.').map(Number)
  if (major < wanted) {
    console.error(`✖ Node ${wanted}+ required, found ${process.versions.node} (see .nvmrc)`)
    process.exit(1)
  }
  console.log(`✔ Node ${process.versions.node}`)
}

const isPortFree = (port) =>
  new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port, '127.0.0.1')
  })

async function freePort(preferred) {
  for (let port = preferred; port < preferred + 100; port += 1) {
    if (await isPortFree(port)) return port
  }
  throw new Error(`No free port near ${preferred}`)
}

const secret = () => randomBytes(48).toString('base64url')

function setVar(content, key, value) {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, 'm')
  return pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`
}

async function createEnv() {
  if (existsSync(envPath)) {
    console.log('✔ .env already exists (left unchanged)')
    return
  }
  let content = readFileSync(examplePath, 'utf8')
  content = setVar(content, 'JWT_ACCESS_SECRET', secret())
  content = setVar(content, 'JWT_REFRESH_SECRET', secret())

  const pgPort = await freePort(5432)
  const redisPort = await freePort(6379)
  content = setVar(content, 'POSTGRES_PORT', String(pgPort))
  content = setVar(content, 'REDIS_PORT', String(redisPort))
  content = content.replace('@localhost:5432/', `@localhost:${pgPort}/`)
  content = content.replace('redis://localhost:6379', `redis://localhost:${redisPort}`)

  writeFileSync(envPath, content)
  console.log('✔ Created .env with generated JWT secrets')
  if (pgPort !== 5432) console.log(`  ℹ Port 5432 is busy: Postgres will use ${pgPort}`)
  if (redisPort !== 6379) console.log(`  ℹ Port 6379 is busy: Redis will use ${redisPort}`)
}

checkNode()
await createEnv()
console.log(`
Next steps:
  pnpm infra:up          # start Postgres + Redis (Docker)
  pnpm db:migrate:dev    # apply migrations
  pnpm db:seed           # optional: admin@example.com
  pnpm dev               # web :5173, api :3000, worker
`)
