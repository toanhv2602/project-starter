#!/usr/bin/env node
/**
 * Create a new project from this starter.
 *
 *   node scripts/create-project.mjs ../my-app --title "My App"
 *
 * Options:
 *   --title "My App"   Human-readable name (default: derived from the folder name)
 *   --no-git           Do not run `git init` + initial commit
 *
 * Copies the starter (without node_modules, build output, .env, .git), renames the
 * project everywhere it appears, and prints the next steps.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const STARTER_SLUG = 'full-node-starter'
const STARTER_TITLE = 'Full Node Starter'

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
  'blob-report',
  '.turbo',
])
// Never copy secrets or personal settings into a new project.
const SKIP_FILES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.staging',
  'settings.local.json',
  'tsconfig.tsbuildinfo',
])
// Files only useful inside the starter itself.
const STARTER_ONLY = ['scripts/create-project.mjs', 'docs/STARTER_CHANGELOG.md']

const TEXT_EXTENSIONS = /\.(json|ya?ml|md|ts|mts|vue|html|mjs|js|conf|example|prisma)$|Dockerfile$/

function parseArgs(argv) {
  const args = { target: undefined, title: undefined, git: true }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--title') args.title = argv[++i]
    else if (arg === '--no-git') args.git = false
    else if (arg === '-h' || arg === '--help') args.help = true
    else if (!args.target) args.target = arg
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

const toSlug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const toTitle = (slug) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.target) {
    console.log('Usage: node scripts/create-project.mjs <target-dir> [--title "My App"] [--no-git]')
    process.exit(args.help ? 0 : 1)
  }

  const starterRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const target = resolve(args.target)
  const slug = toSlug(basename(target))
  if (!slug) throw new Error('Target folder name must contain letters or digits')
  const title = args.title ?? toTitle(slug)

  if (target.startsWith(starterRoot + sep)) {
    throw new Error('Target must be outside the starter folder')
  }
  if (existsSync(target) && readdirSync(target).length > 0) {
    throw new Error(`Target folder is not empty: ${target}`)
  }

  cpSync(starterRoot, target, {
    recursive: true,
    filter: (src) => {
      const name = basename(src)
      if (SKIP_DIRS.has(name)) return false
      if (SKIP_FILES.has(name)) return false
      return true
    },
  })
  for (const file of STARTER_ONLY) rmSync(join(target, file), { force: true })

  let renamed = 0
  for (const file of walk(target)) {
    if (!TEXT_EXTENSIONS.test(file)) continue
    const before = readFileSync(file, 'utf8')
    const after = before.replaceAll(STARTER_SLUG, slug).replaceAll(STARTER_TITLE, title)
    if (after !== before) {
      writeFileSync(file, after)
      renamed += 1
    }
  }

  if (args.git) {
    const git = (...gitArgs) => execFileSync('git', gitArgs, { cwd: target, stdio: 'ignore' })
    try {
      git('init', '-b', 'main')
      git('add', '-A')
      // --no-verify: hooks are not installed yet (no node_modules).
      git('commit', '-m', `chore: scaffold ${slug} from ${STARTER_SLUG}`, '--no-verify')
    } catch {
      console.warn('! git init/commit skipped (is git installed and configured?)')
    }
  }

  const rel = relative(process.cwd(), target) || '.'
  console.log(`
✔ Created "${title}" in ${target} (${renamed} files renamed)

Next steps:
  cd ${rel}
  pnpm install
  pnpm onboard            # .env with generated secrets + free ports
  pnpm infra:up           # Postgres + Redis (Docker)
  pnpm db:migrate:deploy  # apply the initial migration
  pnpm dev                # http://localhost:5173

Then read docs/NEW_FEATURE.md before adding your first module.
`)
}

try {
  main()
} catch (error) {
  console.error(`✖ ${error instanceof Error ? error.message : error}`)
  process.exit(1)
}
