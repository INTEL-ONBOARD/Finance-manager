import { buildApp } from './app'
import { connectDb, closeDb } from './db'
import { createIo } from './realtime/io'
import { config } from './config'
import { logger } from './logger'
import { startMonthlyScheduler } from './email/scheduler'

async function main(): Promise<void> {
  await connectDb()

  const app = await buildApp()
  await app.ready() // ensures app.server exists before Socket.IO attaches
  await createIo(app.server) // share the same HTTP server (REST + WebSocket on one port)

  await app.listen({ port: config.port, host: config.host })
  logger.info(`Finwise backend listening on ${config.host}:${config.port}`)
  startMonthlyScheduler()

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received, draining...`)
    try {
      await app.close() // stops accepting, lets in-flight requests + sockets finish
      await closeDb()
    } finally {
      process.exit(0)
    }
  }
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}

main().catch((err) => {
  logger.error(err)
  process.exit(1)
})
