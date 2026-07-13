import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../auth/tokens'
import { config } from '../config'
import { col } from '../db'

// Resolves the user from the JWT (Authorization: Bearer for desktop, httpOnly
// cookie for web) and stamps req.userId. Rejects anything unverified — the
// client can never assert its own identity.
//
// A valid signature alone isn't enough: logout, "reset password everywhere",
// and the sessions UI all work by deleting the session row, so every request
// must also confirm that row still exists — otherwise a signed-out token
// keeps working until it naturally expires (up to 30 days).
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
    const claims = verifyToken(token, 'access')
    const session = await col('sessions').findOne(
      { sessionId: claims.sid, userId: claims.sub },
      { projection: { _id: 1 } }
    )
    if (!session) {
      await reply.code(401).send({ error: 'session revoked' })
      return
    }
    req.userId = claims.sub
    req.sessionId = claims.sid
  } catch {
    await reply.code(401).send({ error: 'unauthorized' })
  }
}
