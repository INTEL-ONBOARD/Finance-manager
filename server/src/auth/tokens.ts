import jwt from 'jsonwebtoken'
import { config } from '../config'

export type TokenType = 'access' | 'refresh'

export interface AccessClaims {
  sub: string // userId
  sid: string // sessionId
  typ: TokenType
}

export function signAccess(userId: string, sessionId: string): string {
  return jwt.sign({ sid: sessionId, typ: 'access' satisfies TokenType }, config.jwtSecret, {
    subject: userId,
    expiresIn: config.accessTtl,
  } as jwt.SignOptions)
}

export function signRefresh(userId: string, sessionId: string): string {
  return jwt.sign({ sid: sessionId, typ: 'refresh' satisfies TokenType }, config.jwtSecret, {
    subject: userId,
    expiresIn: config.refreshTtl,
  } as jwt.SignOptions)
}

// Tokens issued before the typ claim existed had no typ at all — treat those
// as 'access' so already-logged-in sessions aren't force-logged-out on deploy.
export function verifyToken(token: string, expected: TokenType = 'access'): AccessClaims {
  const decoded = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload
  const typ: TokenType = decoded.typ === 'refresh' ? 'refresh' : 'access'
  if (typ !== expected) throw new Error('unexpected token type')
  return { sub: String(decoded.sub ?? ''), sid: String(decoded.sid ?? ''), typ }
}
