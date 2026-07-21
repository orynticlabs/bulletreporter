import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'

const BASELINE_MIGRATION = '20260705162000_init_payload_prisma_schema'
const RECOVERABLE_MIGRATIONS = new Set([
  '20260721180000_director_messages',
])

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/prisma-safe-deploy.mjs

Safely deploys Prisma migrations.
- Requires DIRECT_DATABASE_URL (direct Neon endpoint without "-pooler").
- Leaves the application's pooled DATABASE_URL unchanged outside this process.
- Existing Payload database: marks the baseline migration as applied, then deploys pending migrations.
- Empty database: deploys all migrations from the beginning.
`)
  process.exit(0)
}

const loadEnvFile = (filePath) => {
  if (!existsSync(filePath)) {
    return
  }

  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const index = trimmed.indexOf('=')
    const key = trimmed.slice(0, index).trim()

    if (process.env[key]) {
      continue
    }

    let value = trimmed.slice(index + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

loadEnvFile(resolve(process.cwd(), '.env'))
loadEnvFile(resolve(process.cwd(), '.env.local'))

const databaseUrl =
  process.env.DIRECT_DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'DIRECT_DATABASE_URL is required for Prisma migrations. Use the direct Neon URL without "-pooler".',
  )
}

if (new URL(databaseUrl).hostname.includes('-pooler')) {
  throw new Error(
    'DIRECT_DATABASE_URL must be a direct Neon connection URL. Its hostname must not contain "-pooler".',
  )
}

// This override exists only inside the migration subprocess. The parent build
// and the Next.js application continue using the pooled DATABASE_URL.
process.env.DATABASE_URL = databaseUrl

const runPrisma = (args) => {
  const command = process.platform === 'win32'
    ? resolve(process.cwd(), 'node_modules/.bin/prisma.cmd')
    : resolve(process.cwd(), 'node_modules/.bin/prisma')

  const result = spawnSync(command, args, {
    env: process.env,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  })

  if (result.error) {
    console.error(`[Prisma] Failed to start Prisma CLI: ${result.error.message}`)
  }

  if (result.signal) {
    console.error(`[Prisma] Prisma CLI exited because of signal: ${result.signal}`)
  }

  if (result.status !== 0) {
    console.error(`[Prisma] Prisma CLI failed while running: prisma ${args.join(' ')}`)
    process.exit(result.status || 1)
  }
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('sslmode=') ? undefined : { rejectUnauthorized: false },
})

try {
  const { rows } = await pool.query(`
    select
      to_regclass('public.news') is not null as has_news_table,
      to_regclass('public._prisma_migrations') is not null as has_prisma_migrations_table
  `)

  const { has_news_table: hasNewsTable, has_prisma_migrations_table: hasPrismaMigrationsTable } =
    rows[0] || {}

  let baselineApplied = false

  if (hasPrismaMigrationsTable) {
    const failedMigrations = await pool.query(`
      select migration_name
      from "_prisma_migrations"
      where finished_at is null
        and rolled_back_at is null
    `)

    for (const { migration_name: migrationName } of failedMigrations.rows) {
      if (!RECOVERABLE_MIGRATIONS.has(migrationName)) {
        continue
      }

      console.log(`[Prisma] Marking corrected failed migration as rolled back: ${migrationName}`)
      runPrisma(['migrate', 'resolve', '--rolled-back', migrationName])
    }

    const applied = await pool.query(
      `
        select 1
        from "_prisma_migrations"
        where migration_name = $1
          and finished_at is not null
        limit 1
      `,
      [BASELINE_MIGRATION],
    )

    baselineApplied = applied.rowCount > 0
  }

  if (hasNewsTable && !baselineApplied) {
    console.log('[Prisma] Existing Payload tables found. Marking production baseline as applied.')
    runPrisma(['migrate', 'resolve', '--applied', BASELINE_MIGRATION])
  }
} finally {
  await pool.end()
}

runPrisma(['migrate', 'deploy'])
