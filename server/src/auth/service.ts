import { randomBytes } from 'crypto'
import { col } from '../db'
import { HttpError } from '../errors'
import { hashPassword, verifyPassword } from './password'
import { signAccess, signRefresh } from './tokens'
import { config } from '../config'
import { logger } from '../logger'
import { createEmailToken, consumeEmailToken } from '../email/tokens'
import { sendVerification, sendPasswordReset } from '../email/send'

export interface PublicUser {
  id: string
  name: string
  email: string
  avatar?: string | null
}

export interface AuthResult {
  user: PublicUser
  sessionId: string
  accessToken: string
  refreshToken: string
}

function deviceLabelFrom(ua?: string): string {
  if (!ua) return 'Web'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/android/i.test(ua)) return 'Android'
  if (/mac/i.test(ua)) return 'macOS'
  if (/win/i.test(ua)) return 'Windows'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Web'
}

async function createSession(userId: string, deviceLabel: string): Promise<string> {
  // Same shape the desktop app writes, so the Settings "devices" list keeps working.
  const sessionId = `s_${Date.now()}`
  const now = new Date().toISOString()
  await col('sessions').insertOne({ sessionId, userId, deviceLabel, createdAt: now, lastActiveAt: now })
  return sessionId
}

function tokensFor(user: PublicUser, sessionId: string): AuthResult {
  return {
    user,
    sessionId,
    accessToken: signAccess(user.id, sessionId),
    refreshToken: signRefresh(user.id, sessionId),
  }
}

export async function register(
  name: string,
  email: string,
  password: string,
  _ua?: string,
  avatar?: string | null
): Promise<{ status: 'verification_sent' }> {
  const users = col('users')
  if (await users.findOne({ email })) throw new HttpError(409, 'Email already registered')
  const { salt, hash } = await hashPassword(password)
  const id = `u_${Date.now()}`
  const unsubToken = randomBytes(16).toString('hex')
  try {
    // Store the chosen avatar now so it survives the verify-before-login flow
    // (login and verifyEmail return it on the user object).
    await users.insertOne({ id, name, email, salt, hash, avatar: avatar ?? null, emailVerified: false, monthlyOptIn: true, unsubToken })
  } catch (err) {
    // The findOne check above has a race window; the unique index on `email`
    // is the real guard against two concurrent registers for the same address.
    if ((err as { code?: number }).code === 11000) throw new HttpError(409, 'Email already registered')
    throw err
  }
  try {
    const raw = await createEmailToken('verify', id, email)
    await sendVerification({ name, email }, `${config.appWebUrl}/verify?token=${raw}`)
  } catch (err) {
    // The verification email is essential (login is gated on it). If it can't
    // be sent, roll back so we don't leave an unverifiable orphan account, and
    // surface a clear, retryable error instead of a generic 500.
    await users.deleteOne({ id })
    logger.error({ err, email }, 'verification email failed at register; rolled back user')
    throw new HttpError(502, 'Could not send the verification email. Please try again shortly.')
  }
  return { status: 'verification_sent' }
}

export async function login(email: string, password: string, ua?: string): Promise<AuthResult> {
  const doc = await col('users').findOne({ email })
  if (!doc) throw new HttpError(401, 'Invalid email or password')
  const ok = await verifyPassword(password, doc.salt as string, doc.hash as string)
  if (!ok) throw new HttpError(401, 'Invalid email or password')
  if (doc.emailVerified === false) throw new HttpError(403, 'Please verify your email')
  const sessionId = await createSession(doc.id as string, deviceLabelFrom(ua))
  return tokensFor(
    { id: doc.id as string, name: doc.name as string, email: doc.email as string, avatar: (doc.avatar as string | undefined) ?? null },
    sessionId
  )
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
  const doc = await col('users').findOne({ id: userId })
  if (!doc) throw new HttpError(404, 'User not found')
  const ok = await verifyPassword(oldPassword, doc.salt as string, doc.hash as string)
  if (!ok) throw new HttpError(400, 'Incorrect current password')
  const { salt, hash } = await hashPassword(newPassword)
  await col('users').updateOne({ id: userId }, { $set: { salt, hash } })
}

export async function userExists(email: string): Promise<boolean> {
  return !!(await col('users').findOne({ email }, { projection: { _id: 0, id: 1 } }))
}

export async function verifyEmail(rawToken: string, ua?: string): Promise<AuthResult> {
  const { userId } = await consumeEmailToken('verify', rawToken)
  const doc = await col('users').findOneAndUpdate(
    { id: userId },
    { $set: { emailVerified: true } },
    { returnDocument: 'after' }
  )
  if (!doc) throw new HttpError(404, 'User not found')
  const sessionId = await createSession(doc.id as string, deviceLabelFrom(ua))
  return tokensFor(
    { id: doc.id as string, name: doc.name as string, email: doc.email as string, avatar: (doc.avatar as string | undefined) ?? null },
    sessionId
  )
}

export async function resendVerification(email: string): Promise<void> {
  const doc = await col('users').findOne({ email })
  if (!doc || doc.emailVerified) return
  // Swallow send failures: this endpoint always reports success (no email
  // enumeration) and a transient email outage must not surface as a 500.
  try {
    const raw = await createEmailToken('verify', doc.id as string, email)
    await sendVerification({ name: doc.name as string, email }, `${config.appWebUrl}/verify?token=${raw}`)
  } catch (err) {
    logger.error({ err, email }, 'resend verification email failed')
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const doc = await col('users').findOne({ email })
  if (!doc || doc.emailVerified === false) return
  // Swallow send failures for the same reasons as resendVerification.
  try {
    const raw = await createEmailToken('reset', doc.id as string, email)
    await sendPasswordReset({ name: doc.name as string, email }, `${config.appWebUrl}/reset?token=${raw}`)
  } catch (err) {
    logger.error({ err, email }, 'password reset email failed')
  }
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const { userId } = await consumeEmailToken('reset', rawToken)
  const { salt, hash } = await hashPassword(newPassword)
  await col('users').updateOne({ id: userId }, { $set: { salt, hash } })
  await col('sessions').deleteMany({ userId }) // force re-login everywhere
}

export async function setMonthlyOptIn(userId: string, optIn: boolean): Promise<void> {
  await col('users').updateOne({ id: userId }, { $set: { monthlyOptIn: optIn } })
}

export async function unsubscribeByToken(token: string): Promise<void> {
  if (!token) return
  await col('users').updateOne({ unsubToken: token }, { $set: { monthlyOptIn: false } })
}
