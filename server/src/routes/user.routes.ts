import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { col } from '../db'
import { emitToUser } from '../realtime/io'

export async function userRoutes(app: FastifyInstance): Promise<void> {
  // Clear all of a user's data (mirrors db:user:clearData).
  app.delete('/api/user/data', async (req) => {
    const userId = req.userId
    const collections = ['transactions', 'goals', 'bills', 'accounts', 'notifications', 'settings', 'sessions']
    await Promise.all(collections.map((name) => col(name).deleteMany({ userId })))
    return { ok: true }
  })

  // Save an avatar as a data URI on the user doc. The desktop sent a file path
  // and read it locally; the web sends the base64 data URI directly.
  app.post('/api/user/avatar', async (req, reply) => {
    const body = z.object({ avatar: z.string().min(1) }).parse(req.body)
    if (!/^data:image\/(png|jpe?g|webp);base64,/.test(body.avatar)) {
      return reply.code(400).send({ ok: false, error: 'Unsupported image format' })
    }
    if (body.avatar.length > Math.ceil(2 * 1024 * 1024 * 1.4)) {
      return reply.code(413).send({ ok: false, error: 'Image must be under 2MB' })
    }
    const r = await col('users').updateOne({ id: req.userId }, { $set: { avatar: body.avatar } })
    if (r.matchedCount === 0) return reply.code(404).send({ ok: false, error: 'User not found' })
    emitToUser(req.userId, 'user:avatar', { avatar: body.avatar })
    return { ok: true, avatar: body.avatar }
  })
}
