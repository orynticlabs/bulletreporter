type LogLevel = 'info' | 'warn' | 'error'

type LogDetails = Record<string, unknown>

const LOG_PREFIX = 'BulletReporter'

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
  const payload = {
    timestamp: new Date().toISOString(),
    scope,
    pid: process.pid,
    message,
    ...details,
  }

  const line = `[${LOG_PREFIX}][${scope}][${level.toUpperCase()}] ${JSON.stringify(payload)}`

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
