import type { FastifyInstance } from 'fastify'
import { col } from '../db'
import { emitToUser } from '../realtime/io'

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/settings', async (req) =>
    (await col('settings').findOne({ userId: req.userId }, { projection: { _id: 0, userId: 0 } })) ?? null
  )

  // Upsert settings and mirror name/email onto the user doc (matches db:settings:save).
  app.put('/api/settings', async (req) => {
    const settings = (req.body ?? {}) as Record<string, unknown>
    await col('settings').updateOne(
      { userId: req.userId },
      { $set: { userId: req.userId, ...settings } },
      { upsert: true }
    )
    const userUpdate: Record<string, string> = {}
    if (typeof settings.name === 'string') userUpdate.name = settings.name
    if (typeof settings.email === 'string') userUpdate.email = settings.email
    if (Object.keys(userUpdate).length) await col('users').updateOne({ id: req.userId }, { $set: userUpdate })
    emitToUser(req.userId, 'settings:updated', settings)
    return { ok: true }
  })
}
