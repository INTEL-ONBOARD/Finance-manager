import jwt from 'jsonwebtoken'
import { config } from '../config'

export interface AccessClaims {
  sub: string // userId
  sid: string // sessionId
}

export function signAccess(userId: string, sessionId: string): string {
  return jwt.sign({ sid: sessionId }, config.jwtSecret, {
    subject: userId,
    expiresIn: config.accessTtl,
  } as jwt.SignOptions)
}

export function signRefresh(userId: string, sessionId: string): string {
  return jwt.sign({ sid: sessionId, typ: 'refresh' }, config.jwtSecret, {
    subject: userId,
    expiresIn: config.refreshTtl,
  } as jwt.SignOptions)
}

export function verifyToken(token: string): AccessClaims {
  const decoded = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload
  return { sub: String(decoded.sub ?? ''), sid: String(decoded.sid ?? '') }
}
