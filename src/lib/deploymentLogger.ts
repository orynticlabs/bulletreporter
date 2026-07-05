type LogLevel = 'info' | 'warn' | 'error'

type LogDetails = Record<string, unknown>

const LOG_PREFIX = 'BulletReporter'

const formatValue = (value: unknown): string => {
  if (value === undefined) return ''
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

const formatDetails = (details: LogDetails): string => {
  const entries = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${formatValue(value)}`)

  return entries.length ? ` (${entries.join(', ')})` : ''
}

const writeLogLine = (level: LogLevel, line: string) => {
  const stream = level === 'info' ? process.stdout : process.stderr

  if (stream?.write) {
    stream.write(`${line}\n`)
    return
  }

  if (level === 'error') {
    console.error(line)
    return
  }

  if (level === 'warn') {
    console.warn(line)
    return
  }

  console.info(line)
}

const serializeError = (error: unknown): LogDetails => {
  if (!error || typeof error !== 'object') {
    return { message: String(error) }
  }

  const err = error as Error & {
    aggregateErrors?: unknown[]
    code?: string
    command?: string
    errno?: number
    port?: number
    syscall?: string
  }

  return {
    name: err.name,
    message: err.message,
    code: err.code,
    errno: err.errno,
    syscall: err.syscall,
    command: err.command,
    port: err.port,
    aggregateErrors: Array.isArray(err.aggregateErrors)
      ? err.aggregateErrors.map(serializeError)
      : undefined,
  }
}

export const logDeploymentEvent = (
  level: LogLevel,
  scope: string,
  message: string,
  details: LogDetails = {},
) => {
  const line = `[${LOG_PREFIX}] ${new Date().toISOString()} ${level.toUpperCase()} ${scope} - ${message}${formatDetails({
    pid: process.pid,
    ...details,
  })}`

  writeLogLine(level, line)
}

export const logDeploymentEventOnce = (
  key: string,
  level: LogLevel,
  scope: string,
  message: string,
  details: LogDetails = {},
) => {
  const globalScope = globalThis as typeof globalThis & {
    __bulletReporterLoggedEvents?: Set<string>
  }

  if (!globalScope.__bulletReporterLoggedEvents) {
    globalScope.__bulletReporterLoggedEvents = new Set()
  }

  if (globalScope.__bulletReporterLoggedEvents.has(key)) return

  globalScope.__bulletReporterLoggedEvents.add(key)
  logDeploymentEvent(level, scope, message, details)
}

export const toLoggableError = serializeError
