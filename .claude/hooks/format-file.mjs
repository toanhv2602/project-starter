// PostToolUse hook: format the file Claude just edited with the repo's Prettier.
// Never fails the tool call: formatting problems are reported, not blocking.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const FORMATTABLE = new Set([
  '.ts',
  '.mts',
  '.cts',
  '.js',
  '.mjs',
  '.cjs',
  '.vue',
  '.json',
  '.md',
  '.css',
  '.yml',
  '.yaml',
  '.html',
])

try {
  const input = JSON.parse(readFileSync(0, 'utf8'))
  const file = input?.tool_input?.file_path
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
  const prettier = join(root, 'node_modules', 'prettier', 'bin', 'prettier.cjs')
  if (
    typeof file === 'string' &&
    FORMATTABLE.has(extname(file)) &&
    !file.includes('node_modules') &&
    existsSync(file) &&
    existsSync(prettier)
  ) {
    spawnSync(process.execPath, [prettier, '--write', '--log-level', 'warn', file], {
      cwd: root,
      stdio: ['ignore', 'ignore', 'inherit'],
    })
  }
} catch {
  // Ignore malformed hook input.
}
process.exit(0)
