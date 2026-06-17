import pino from 'pino'
import { config } from './config'

export const logger = pino(
  config.isProd
    ? { level: process.env.LOG_LEVEL ?? 'info' }
    : { level: 'debug', transport: { target: 'pino-pretty', options: { colorize: true } } }
)
