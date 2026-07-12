import Redis from 'ioredis'
import { config } from './config'

let redis: Redis | null = null
function client(): Redis | null {
  if (!config.redisUrl) return null
  if (!redis) redis = new Redis(config.redisUrl)
  return redis
}

export async function checkRateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const c = client()
  if (!c) return true // no Redis (dev/test) -> do not block
  const k = `rl:${key}`
  const n = await c.incr(k)
  if (n === 1) await c.expire(k, windowSec)
  return n <= limit
}
