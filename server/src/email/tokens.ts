import { randomBytes, createHash } from 'crypto'
import { col } from '../db'
import { HttpError } from '../errors'

export type EmailTokenType = 'verify' | 'reset'
const TTL_MS: Record<EmailTokenType, number> = { verify: 24 * 60 * 60 * 1000, reset: 60 * 60 * 1000 }

function hash(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export async function createEmailToken(type: EmailTokenType, userId: string, email: string): Promise<string> {
  const raw = randomBytes(32).toString('hex')
  await col('emailTokens').insertOne({
    tokenHash: hash(raw),
    type,
    userId,
    email,
    expiresAt: new Date(Date.now() + TTL_MS[type]),
    usedAt: null,
  })
  return raw
}

export async function consumeEmailToken(
  type: EmailTokenType,
  rawToken: string
): Promise<{ userId: string; email: string }> {
  const doc = await col('emailTokens').findOneAndUpdate(
    { tokenHash: hash(rawToken), type, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { returnDocument: 'after' }
  )
  if (!doc) throw new HttpError(400, 'Invalid or expired link')
  return { userId: doc.userId as string, email: doc.email as string }
}
