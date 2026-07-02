/**
 * 日志系统（暂用 console，后续可替换为 Winston/Pino）
 * 
 * 级别：error > warn > info > debug
 */

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 } as const
type LogLevel = keyof typeof LOG_LEVELS

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel]
}

function timestamp(): string {
  return new Date().toISOString()
}

function formatMessage(level: string, message: string, meta?: any): string {
  const prefix = `[${timestamp()}] [${level.toUpperCase()}]`
  if (meta !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(meta)}`
  }
  return `${prefix} ${message}`
}

export const logger = {
  error(message: string, meta?: any) {
    if (shouldLog('error')) console.error(formatMessage('error', message, meta))
  },

  warn(message: string, meta?: any) {
    if (shouldLog('warn')) console.warn(formatMessage('warn', message, meta))
  },

  info(message: string, meta?: any) {
    if (shouldLog('info')) console.log(formatMessage('info', message, meta))
  },

  debug(message: string, meta?: any) {
    if (shouldLog('debug')) console.debug(formatMessage('debug', message, meta))
  },

  // HTTP 请求日志
  http(method: string, path: string, statusCode: number, durationMs: number) {
    const statusEmoji = statusCode < 400 ? '✅' : statusCode < 500 ? '⚠️' : '❌'
    console.log(
      `[${timestamp()}] ${statusEmoji} ${method} ${path} → ${statusCode} (${durationMs}ms)`
    )
  },
}

