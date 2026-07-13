import type { FastifyInstance } from 'fastify'
import { col } from '../db'
import { emitToUser } from '../realtime/io'
import { HttpError } from '../errors'

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/settings', async (req) =>
    (await col('settings').findOne({ userId: req.userId }, { projection: { _id: 0, userId: 0 } })) ?? null
  )

  // Upsert settings and mirror name/email onto the user doc (matches db:settings:save).
  app.put('/api/settings', async (req) => {
    const body = (req.body ?? {}) as Record<string, unknown>
    // Never trust a client-asserted userId — it must always be the caller's own,
    // otherwise a request body like {"userId":"<victim>"} would overwrite
    // another user's settings.
    const { userId: _ignoredClientUserId, ...settings } = body
    await col('settings').updateOne(
      { userId: req.userId },
      { $set: { ...settings, userId: req.userId } },
      { upsert: true }
    )
    const userUpdate: Record<string, string> = {}
    if (typeof settings.name === 'string' && settings.name.trim()) userUpdate.name = settings.name.trim()
    if (typeof settings.email === 'string' && settings.email.trim()) {
      const nextEmail = settings.email.trim().toLowerCase()
      const existing = await col('users').findOne({ email: nextEmail, id: { $ne: req.userId } })
      if (existing) throw new HttpError(409, 'Email already in use')
      userUpdate.email = nextEmail
    }
    if (Object.keys(userUpdate).length) {
      try {
        await col('users').updateOne({ id: req.userId }, { $set: userUpdate })
      } catch (err) {
        // Race with another concurrent request claiming the same email.
        if ((err as { code?: number }).code === 11000) throw new HttpError(409, 'Email already in use')
        throw err
      }
    }
    emitToUser(req.userId, 'settings:updated', settings)
    return { ok: true }
  })
}
