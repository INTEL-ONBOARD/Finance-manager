import { col } from '../db'
import { HttpError } from '../errors'
import { hashPassword, verifyPassword } from './password'
import { signAccess, signRefresh } from './tokens'

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

export async function register(name: string, email: string, password: string, ua?: string): Promise<AuthResult> {
  const users = col('users')
  if (await users.findOne({ email })) throw new HttpError(409, 'Email already registered')
  const { salt, hash } = await hashPassword(password)
  const id = `u_${Date.now()}`
  await users.insertOne({ id, name, email, salt, hash })
  const sessionId = await createSession(id, deviceLabelFrom(ua))
  return tokensFor({ id, name, email, avatar: null }, sessionId)
}

export async function login(email: string, password: string, ua?: string): Promise<AuthResult> {
  const doc = await col('users').findOne({ email })
  if (!doc) throw new HttpError(401, 'Invalid email or password')
  const ok = await verifyPassword(password, doc.salt as string, doc.hash as string)
  if (!ok) throw new HttpError(401, 'Invalid email or password')
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
