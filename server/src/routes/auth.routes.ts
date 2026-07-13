import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import * as auth from '../auth/service'
import { authGuard } from '../middleware/authGuard'
import { signAccess, verifyToken } from '../auth/tokens'
import { config } from '../config'
import { checkRateLimit } from '../rateLimit'
import { col } from '../db'

const PASSWORD_MIN = 8
const credsSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
const registerSchema = credsSchema.extend({
  password: z.string().min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`),
  name: z.string().min(1),
  avatar: z.string().optional(),
})

function setAuthCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

function clientKey(req: FastifyRequest): string {
  return req.ip
}

async function enforceRateLimit(
  reply: FastifyReply,
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  const allowed = await checkRateLimit(key, limit, windowSec)
  if (!allowed) await reply.code(429).send({ error: 'Too many attempts. Please try again later.' })
  return allowed
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/register', async (req, reply) => {
    if (!(await enforceRateLimit(reply, `register:${clientKey(req)}`, 5, 3600))) return
    const body = registerSchema.parse(req.body)
    const res = await auth.register(body.name, body.email, body.password, req.headers['user-agent'], body.avatar)
    reply.code(201)
    return res
  })

  app.post('/api/auth/login', async (req, reply) => {
    const body = credsSchema.parse(req.body)
    if (!(await enforceRateLimit(reply, `login:${body.email}`, 10, 900))) return
    if (!(await enforceRateLimit(reply, `login-ip:${clientKey(req)}`, 30, 900))) return
    const res = await auth.login(body.email, body.password, req.headers['user-agent'])
    setAuthCookie(reply, res.accessToken)
    return res
  })

  // Authenticated so we know which session to revoke — a signed-out token
  // must stop working immediately, not just lose its cookie client-side.
  app.post('/api/auth/logout', { preHandler: authGuard }, async (req, reply) => {
    await col('sessions').deleteOne({ sessionId: req.sessionId, userId: req.userId })
    reply.clearCookie(config.cookieName, { path: '/' })
    return { ok: true }
  })

  app.get('/api/auth/exists', async (req, reply) => {
    if (!(await enforceRateLimit(reply, `exists:${clientKey(req)}`, 20, 3600))) return
    const email = (req.query as { email?: string }).email ?? ''
    return { exists: await auth.userExists(email) }
  })

  // Rotate a fresh access token from a still-valid *refresh* token (body only —
  // the cookie holds the short-lived access token, never the refresh token).
  app.post('/api/auth/refresh', async (req, reply) => {
    const token = (req.body as { refreshToken?: string } | undefined)?.refreshToken
    if (!token) return reply.code(401).send({ error: 'unauthorized' })
    try {
      const claims = verifyToken(token, 'refresh')
      const session = await col('sessions').findOne({ sessionId: claims.sid, userId: claims.sub })
      if (!session) return reply.code(401).send({ error: 'session revoked' })
      const access = signAccess(claims.sub, claims.sid)
      setAuthCookie(reply, access)
      return { accessToken: access }
    } catch {
      return reply.code(401).send({ error: 'unauthorized' })
    }
  })

  app.post('/api/auth/change-password', { preHandler: authGuard }, async (req, reply) => {
    if (!(await enforceRateLimit(reply, `changepw:${req.userId}`, 5, 900))) return
    const body = z
      .object({ oldPassword: z.string().min(1), newPassword: z.string().min(PASSWORD_MIN) })
      .parse(req.body)
    await auth.changePassword(req.userId, body.oldPassword, body.newPassword)
    return { ok: true }
  })

  app.post('/api/auth/verify', async (req, reply) => {
    if (!(await enforceRateLimit(reply, `verify:${clientKey(req)}`, 20, 3600))) return
    const body = z.object({ token: z.string().min(1) }).parse(req.body)
    const res = await auth.verifyEmail(body.token, req.headers['user-agent'])
    setAuthCookie(reply, res.accessToken)
    return res
  })

  app.post('/api/auth/resend-verification', async (req) => {
    const body = z.object({ email: z.string().email() }).parse(req.body)
    const allowed = await checkRateLimit(`resend:${body.email}`, 3, 3600)
    if (allowed) await auth.resendVerification(body.email)
    return { ok: true }
  })

  app.post('/api/auth/forgot-password', async (req) => {
    const body = z.object({ email: z.string().email() }).parse(req.body)
    const allowed = await checkRateLimit(`forgot:${body.email}`, 3, 3600)
    if (allowed) await auth.requestPasswordReset(body.email)
    return { ok: true }
  })

  app.post('/api/auth/reset-password', async (req, reply) => {
    if (!(await enforceRateLimit(reply, `resetpw:${clientKey(req)}`, 10, 3600))) return
    const body = z
      .object({ token: z.string().min(1), newPassword: z.string().min(PASSWORD_MIN) })
      .parse(req.body)
    await auth.resetPassword(body.token, body.newPassword)
    return { ok: true }
  })
}
