import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import * as auth from '../auth/service'
import { authGuard } from '../middleware/authGuard'

export async function emailRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/email/unsubscribe', async (req) => {
    const token = (req.query as { token?: string }).token ?? ''
    await auth.unsubscribeByToken(token)
    return { ok: true }
  })

  app.post('/api/email/monthly-opt-in', { preHandler: authGuard }, async (req) => {
    const body = z.object({ optIn: z.boolean() }).parse(req.body)
    await auth.setMonthlyOptIn(req.userId, body.optIn)
    return { ok: true }
  })
}
