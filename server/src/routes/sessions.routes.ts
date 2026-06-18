import type { FastifyInstance } from 'fastify'
import { col } from '../db'

export async function sessionsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/sessions', async (req) =>
    col('sessions')
      .find({ userId: req.userId }, { projection: { _id: 0 } })
      .sort({ lastActiveAt: -1 })
      .toArray()
  )

  app.delete('/api/sessions/:sessionId', async (req) => {
    const { sessionId } = req.params as { sessionId: string }
    await col('sessions').deleteOne({ userId: req.userId, sessionId })
    return { ok: true }
  })
}
