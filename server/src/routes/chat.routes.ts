import type { FastifyInstance } from 'fastify'
import { col } from '../db'
import { emitToConversation } from '../realtime/io'
import { isParticipant, dmRegexFor } from '../chat/participants'
import { HttpError } from '../errors'

const MAX_MESSAGES_LIMIT = 100

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
        { $match: { $or: [{ conversationId: 'group' }, { conversationId: { $regex: dmRegexFor(userId) } }] } },
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
    const convoId = conversationId ?? ''
    if (!isParticipant(convoId, req.userId)) throw new HttpError(403, 'Not a participant in this conversation')
    const filter: Record<string, unknown> = { conversationId: convoId }
    if (before) filter.sentAt = { $lt: before }
    const cappedLimit = Math.min(parseInt(limit ?? '40', 10) || 40, MAX_MESSAGES_LIMIT)
    const msgs = await col('messages')
      .find(filter, { projection: { _id: 0 } })
      .sort({ sentAt: -1 })
      .limit(cappedLimit)
      .toArray()
    return msgs.reverse()
  })

  app.post('/api/chat/messages', async (req) => {
    const body = (req.body ?? {}) as Record<string, unknown>
    const conversationId = String(body.conversationId ?? '')
    if (!isParticipant(conversationId, req.userId)) throw new HttpError(403, 'Not a participant in this conversation')
    const sender = await col('users').findOne(
      { id: req.userId },
      { projection: { _id: 0, name: 1 } }
    )
    if (!sender) throw new HttpError(404, 'User not found')
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    // Identity is always stamped from the verified token, never trusted from
    // the client — otherwise any caller could post messages as anyone else.
    const message = {
      conversationId,
      body: String(body.body ?? ''),
      sentAt: new Date().toISOString(),
      id,
      senderId: req.userId,
      senderName: sender.name as string,
    }
    await col('messages').insertOne(message)
    emitToConversation(conversationId, 'chat:message', { conversationId, message })
    return { ok: true, id }
  })
}
