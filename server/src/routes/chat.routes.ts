import type { FastifyInstance } from 'fastify'
import { col } from '../db'
import { emitToConversation } from '../realtime/io'

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  // Other users with their latest presence (mirrors chat:users:list).
  app.get('/api/chat/users', async (req) => {
    const selfId = req.userId
    const users = await col('users')
      .find({ id: { $ne: selfId } }, { projection: { _id: 0, id: 1, name: 1, email: 1, avatar: 1 } })
      .toArray()
    const ids = users.map((u) => u.id)
    const sessions = await col('sessions')
      .aggregate([
        { $match: { userId: { $in: ids } } },
        { $sort: { lastActiveAt: -1 } },
        { $group: { _id: '$userId', lastActiveAt: { $first: '$lastActiveAt' } } },
      ])
      .toArray()
    const presence = new Map(sessions.map((s) => [s._id, s.lastActiveAt]))
    return users.map((u) => ({ ...u, lastActiveAt: presence.get(u.id) ?? null }))
  })

  app.get('/api/chat/conversations', async (req) => {
    const userId = req.userId
    return col('messages')
      .aggregate([
        { $match: { $or: [{ conversationId: 'group' }, { conversationId: { $regex: userId } }] } },
        { $sort: { sentAt: -1 } },
        { $group: { _id: '$conversationId', lastMessage: { $first: '$body' }, lastMessageAt: { $first: '$sentAt' } } },
        { $project: { _id: 0, id: '$_id', lastMessage: 1, lastMessageAt: 1 } },
        { $sort: { lastMessageAt: -1 } },
      ])
      .toArray()
  })

  app.get('/api/chat/messages', async (req) => {
    const { conversationId, limit, before } = req.query as {
      conversationId?: string
      limit?: string
      before?: string
    }
    const filter: Record<string, unknown> = { conversationId: conversationId ?? '' }
    if (before) filter.sentAt = { $lt: before }
    const msgs = await col('messages')
      .find(filter, { projection: { _id: 0 } })
      .sort({ sentAt: -1 })
      .limit(parseInt(limit ?? '40', 10))
      .toArray()
    return msgs.reverse()
  })

  app.post('/api/chat/messages', async (req) => {
    const doc = (req.body ?? {}) as Record<string, unknown>
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const message = { ...doc, id }
    await col('messages').insertOne(message)
    const conversationId = String(doc.conversationId ?? '')
    // Strip _id mongo adds in place before broadcasting.
    const { _id, ...clean } = message as Record<string, unknown>
    emitToConversation(conversationId, 'chat:message', { conversationId, message: clean })
    return { ok: true, id }
  })
}
