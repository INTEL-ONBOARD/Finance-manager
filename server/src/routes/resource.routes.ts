import type { FastifyInstance } from 'fastify'
import { col } from '../db'
import { emitToUser } from '../realtime/io'
import { RESOURCES } from '../resources'

// Generates the same CRUD surface the desktop exposed over IPC, but every
// mutation also fans out a realtime event to the user's room so all of their
// devices reconcile live. userId always comes from req (the verified token).
export async function resourceRoutes(app: FastifyInstance): Promise<void> {
  for (const { name } of RESOURCES) {
    app.get(`/api/${name}`, async (req) =>
      col(name)
        .find({ userId: req.userId }, { projection: { _id: 0, userId: 0 } })
        .toArray()
    )

    app.post(`/api/${name}`, async (req, reply) => {
      const doc = (req.body ?? {}) as Record<string, unknown>
      await col(name).insertOne({ ...doc, userId: req.userId })
      emitToUser(req.userId, `${name}:created`, doc)
      reply.code(201)
      return doc
    })

    app.patch(`/api/${name}/:id`, async (req) => {
      const { id } = req.params as { id: string }
      const updates = (req.body ?? {}) as Record<string, unknown>
      await col(name).updateOne({ id, userId: req.userId }, { $set: updates })
      emitToUser(req.userId, `${name}:updated`, { id, updates })
      return { ok: true }
    })

    app.delete(`/api/${name}/:id`, async (req) => {
      const { id } = req.params as { id: string }
      await col(name).deleteOne({ id, userId: req.userId })
      emitToUser(req.userId, `${name}:deleted`, { id })
      return { ok: true }
    })
  }

  // Bills — toggle paid (mirrors db:bills:togglePaid).
  app.post('/api/bills/:id/toggle-paid', async (req) => {
    const { id } = req.params as { id: string }
    const bill = await col('bills').findOne({ id, userId: req.userId }, { projection: { _id: 0, paid: 1 } })
    if (bill) {
      const paid = !bill.paid
      await col('bills').updateOne({ id, userId: req.userId }, { $set: { paid } })
      emitToUser(req.userId, 'bills:updated', { id, updates: { paid } })
    }
    return { ok: true }
  })

  // Notifications — mark one / all read.
  app.post('/api/notifications/:id/read', async (req) => {
    const { id } = req.params as { id: string }
    await col('notifications').updateOne({ id, userId: req.userId }, { $set: { read: true } })
    emitToUser(req.userId, 'notifications:updated', { id, updates: { read: true } })
    return { ok: true }
  })

  app.post('/api/notifications/read-all', async (req) => {
    await col('notifications').updateMany({ userId: req.userId, read: false }, { $set: { read: true } })
    emitToUser(req.userId, 'notifications:read-all', {})
    return { ok: true }
  })
}
