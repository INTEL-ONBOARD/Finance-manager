import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import * as auth from '../auth/service'
import { authGuard } from '../middleware/authGuard'
import { signAccess, verifyToken } from '../auth/tokens'
import { config } from '../config'
import { checkRateLimit } from '../rateLimit'

const credsSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
const registerSchema = credsSchema.extend({ name: z.string().min(1), avatar: z.string().optional() })

function setAuthCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/register', async (req, reply) => {
    const body = registerSchema.parse(req.body)
    const res = await auth.register(body.name, body.email, body.password, req.headers['user-agent'], body.avatar)
    reply.code(201)
    return res
  })

  app.post('/api/auth/login', async (req, reply) => {
    const body = credsSchema.parse(req.body)
    const res = await auth.login(body.email, body.password, req.headers['user-agent'])
    setAuthCookie(reply, res.accessToken)
    return res
  })

  app.post('/api/auth/logout', async (_req, reply) => {
    reply.clearCookie(config.cookieName, { path: '/' })
    return { ok: true }
  })

  app.get('/api/auth/exists', async (req) => {
    const email = (req.query as { email?: string }).email ?? ''
    return { exists: await auth.userExists(email) }
  })

  // Rotate a fresh access token from a still-valid token (cookie or body).
  app.post('/api/auth/refresh', async (req, reply) => {
    const token =
      (req.body as { refreshToken?: string } | undefined)?.refreshToken ??
      (req.cookies as Record<string, string> | undefined)?.[config.cookieName]
    if (!token) return reply.code(401).send({ error: 'unauthorized' })
    try {
      const claims = verifyToken(token)
      const access = signAccess(claims.sub, claims.sid)
      setAuthCookie(reply, access)
      return { accessToken: access }
    } catch {
      return reply.code(401).send({ error: 'unauthorized' })
    }
  })

  app.post('/api/auth/change-password', { preHandler: authGuard }, async (req) => {
    const body = z.object({ oldPassword: z.string().min(1), newPassword: z.string().min(6) }).parse(req.body)
    await auth.changePassword(req.userId, body.oldPassword, body.newPassword)
    return { ok: true }
  })

  app.post('/api/auth/verify', async (req, reply) => {
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

  app.post('/api/auth/reset-password', async (req) => {
    const body = z.object({ token: z.string().min(1), newPassword: z.string().min(6) }).parse(req.body)
    await auth.resetPassword(body.token, body.newPassword)
    return { ok: true }
  })
}
