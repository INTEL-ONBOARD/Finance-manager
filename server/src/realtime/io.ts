import type { Server as HttpServer } from 'http'
import { Server as IOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'
import { config } from '../config'
import { logger } from '../logger'
import { verifyToken } from '../auth/tokens'
import { col } from '../db'

let io: IOServer | null = null

function parseCookies(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export async function createIo(httpServer: HttpServer): Promise<IOServer> {
  io = new IOServer(httpServer, {
    path: '/socket.io',
    cors: { origin: config.corsOrigins, credentials: true },
  })

  // Scale-out: every gateway instance shares rooms + presence through Redis,
  // so a write handled by one pod reaches sockets connected to any other pod.
  if (config.redisUrl) {
    const pub = new Redis(config.redisUrl)
    const sub = pub.duplicate()
    io.adapter(createAdapter(pub as never, sub as never))
    logger.info('Socket.IO Redis adapter enabled')
  }

  // Identity comes from the signed token only — never from a client-supplied id.
  io.use((socket, next) => {
    try {
      const fromAuth = (socket.handshake.auth as { token?: string } | undefined)?.token
      const fromCookie = parseCookies(socket.handshake.headers.cookie ?? '')[config.cookieName]
      const token = fromAuth || fromCookie
      if (!token) return next(new Error('unauthorized'))
      const claims = verifyToken(token)
      socket.data.userId = claims.sub
      socket.data.sessionId = claims.sid
      next()
    } catch {
      next(new Error('unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string
    socket.join(`user:${userId}`) // multi-device live-sync room
    socket.join('presence') // receives presence broadcasts

    socket.on('conversation:join', (conversationId: unknown) => {
      if (typeof conversationId === 'string') socket.join(`conv:${conversationId}`)
    })
    socket.on('conversation:leave', (conversationId: unknown) => {
      if (typeof conversationId === 'string') socket.leave(`conv:${conversationId}`)
    })

    socket.on('presence:ping', async () => {
      const sessionId = socket.data.sessionId as string
      const lastActiveAt = new Date().toISOString()
      try {
        await col('sessions').updateOne({ sessionId }, { $set: { lastActiveAt } })
      } catch (err) {
        logger.debug({ err }, 'presence ping update failed')
      }
      io?.to('presence').emit('presence:update', { userId, lastActiveAt })
    })
  })

  return io
}

/** Fan a change out to every device the user has connected. */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload)
}

/** Push a chat event to everyone currently in a conversation. */
export function emitToConversation(conversationId: string, event: string, payload: unknown): void {
  io?.to(`conv:${conversationId}`).emit(event, payload)
}
