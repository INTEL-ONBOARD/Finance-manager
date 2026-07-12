import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { ZodError } from 'zod'
import { config } from './config'
import { logger } from './logger'
import { HttpError } from './errors'
import { authGuard } from './middleware/authGuard'
import { healthRoutes } from './routes/health.routes'
import { authRoutes } from './routes/auth.routes'
import { resourceRoutes } from './routes/resource.routes'
import { settingsRoutes } from './routes/settings.routes'
import { sessionsRoutes } from './routes/sessions.routes'
import { chatRoutes } from './routes/chat.routes'
import { userRoutes } from './routes/user.routes'
import { emailRoutes } from './routes/email.routes'

export async function buildApp() {
  // Fastify v5: a pre-built logger instance must be passed as `loggerInstance`
  // (`logger` only accepts a boolean or a config object).
  const app = Fastify({ loggerInstance: logger, trustProxy: true })

  await app.register(cors, { origin: config.corsOrigins, credentials: true })
  await app.register(cookie)

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof HttpError) return reply.code(err.status).send({ error: err.message })
    if (err instanceof ZodError) return reply.code(400).send({ error: 'invalid request', details: err.issues })
    req.log.error(err)
    return reply.code(500).send({ error: 'internal error' })
  })

  // Public
  await app.register(healthRoutes)
  await app.register(authRoutes)
  await app.register(emailRoutes)

  // Protected — everything below requires a verified token.
  await app.register(async (secured) => {
    secured.addHook('preHandler', authGuard)
    await secured.register(resourceRoutes)
    await secured.register(settingsRoutes)
    await secured.register(sessionsRoutes)
    await secured.register(chatRoutes)
    await secured.register(userRoutes)
  })

  return app
}
