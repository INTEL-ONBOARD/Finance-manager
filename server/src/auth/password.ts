import { scrypt, randomBytes, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

// IMPORTANT: these parameters match the desktop app exactly (src/main/index.ts)
// so accounts created in the desktop client log in unchanged here:
//   salt = randomBytes(16).toString('hex'),  hash = scrypt(password, salt, 64) hex
export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = randomBytes(16).toString('hex')
  const hash = ((await scryptAsync(password, salt, 64)) as Buffer).toString('hex')
  return { salt, hash }
}

export async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  const hashBuf = (await scryptAsync(password, salt, 64)) as Buffer
  const storedBuf = Buffer.from(storedHash, 'hex')
  return hashBuf.length === storedBuf.length && timingSafeEqual(hashBuf, storedBuf)
}
