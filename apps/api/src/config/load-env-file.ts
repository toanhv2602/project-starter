import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Load the monorepo root `.env` (if present) without overriding variables that are
 * already set. Walks up from the current directory until it finds pnpm-workspace.yaml.
 * In containers there is no .env file: variables come from the orchestrator.
 */
export function loadEnvFile(startDir: string = process.cwd()): string | undefined {
  let dir = startDir
  for (;;) {
    const candidate = join(dir, '.env')
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate)
      return candidate
    }
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return undefined
    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}
