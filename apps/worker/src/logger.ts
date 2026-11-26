import pino from 'pino'

export const createLogger = (level: string, pretty: boolean) =>
  pino({
    level,
    base: { service: 'worker' },
    redact: ['*.password', '*.token', '*.accessToken', '*.refreshToken'],
    transport: pretty ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
  })

export type Logger = ReturnType<typeof createLogger>
