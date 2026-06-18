import type { FastifyInstance } from 'fastify'
import { col } from '../db'

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Liveness — used by Docker/K8s probes.
  app.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }))

  // Readiness — confirms the DB is reachable (mirrors the desktop db:status check).
  app.get('/api/db/status', async () => {
    try {
      await col('users').estimatedDocumentCount()
      return { ready: true, error: null }
    } catch (err) {
      return { ready: false, error: (err as Error).message }
    }
  })
}
