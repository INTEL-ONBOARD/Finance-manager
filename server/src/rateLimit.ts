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
  // Atomic INCR + first-hit EXPIRE so a key can never be left without a TTL.
  const n = (await c.eval(
    "local c = redis.call('INCR', KEYS[1]) if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end return c",
    1,
    k,
    String(windowSec)
  )) as number
  return n <= limit
}
