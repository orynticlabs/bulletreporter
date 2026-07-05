import { defineConfig, env } from 'prisma/config'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const loadLocalEnv = () => {
  const localEnvPath = resolve(process.cwd(), '.env.local')
  const allowedKeys = new Set([
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'PAYLOAD_DATABASE_URL',
  ])

  if (!existsSync(localEnvPath)) {
    return
  }

  for (const line of readFileSync(localEnvPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()

    if (!allowedKeys.has(key)) {
      continue
    }

    if (process.env[key]) {
      continue
    }

    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

loadLocalEnv()

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.PAYLOAD_DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
  },
})
