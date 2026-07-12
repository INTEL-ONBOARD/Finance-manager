import { randomBytes } from 'crypto'
import { col } from '../db'
import { HttpError } from '../errors'
import { hashPassword, verifyPassword } from './password'
import { signAccess, signRefresh } from './tokens'
import { config } from '../config'
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
  _ua?: string
): Promise<{ status: 'verification_sent' }> {
  const users = col('users')
  if (await users.findOne({ email })) throw new HttpError(409, 'Email already registered')
  const { salt, hash } = await hashPassword(password)
  const id = `u_${Date.now()}`
  const unsubToken = randomBytes(16).toString('hex')
  await users.insertOne({ id, name, email, salt, hash, emailVerified: false, monthlyOptIn: true, unsubToken })
  const raw = await createEmailToken('verify', id, email)
  await sendVerification({ name, email }, `${config.appWebUrl}/verify?token=${raw}`)
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
  const raw = await createEmailToken('verify', doc.id as string, email)
  await sendVerification({ name: doc.name as string, email }, `${config.appWebUrl}/verify?token=${raw}`)
}

export async function requestPasswordReset(email: string): Promise<void> {
  const doc = await col('users').findOne({ email })
  if (!doc || doc.emailVerified === false) return
  const raw = await createEmailToken('reset', doc.id as string, email)
  await sendPasswordReset({ name: doc.name as string, email }, `${config.appWebUrl}/reset?token=${raw}`)
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const { userId } = await consumeEmailToken('reset', rawToken)
  const { salt, hash } = await hashPassword(newPassword)
  await col('users').updateOne({ id: userId }, { $set: { salt, hash } })
  await col('sessions').deleteMany({ userId }) // force re-login everywhere
}
