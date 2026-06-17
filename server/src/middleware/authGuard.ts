import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../auth/tokens'
import { config } from '../config'

// Resolves the user from the JWT (Authorization: Bearer for desktop, httpOnly
// cookie for web) and stamps req.userId. Rejects anything unverified — the
// client can never assert its own identity.
export async function authGuard(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const header = req.headers.authorization
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[config.cookieName]
    const token = bearer ?? cookieToken
    if (!token) {
      await reply.code(401).send({ error: 'unauthorized' })
      return
    }
    const claims = verifyToken(token)
    req.userId = claims.sub
    req.sessionId = claims.sid
  } catch {
    await reply.code(401).send({ error: 'unauthorized' })
  }
}
