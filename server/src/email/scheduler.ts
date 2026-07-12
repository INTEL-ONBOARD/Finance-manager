import cron from 'node-cron'
import Redis from 'ioredis'
import { col } from '../db'
import { config } from '../config'
import { logger } from '../logger'
import { buildMonthlySummary, prevMonthRange } from './summary'
import { sendMonthlySummary } from './send'

export async function runMonthlyBatch(now: Date): Promise<{ sent: number; failed: number }> {
  const range = prevMonthRange(now)
  const users = (await col('users')
    .find({ emailVerified: true, monthlyOptIn: true })
    .toArray()) as unknown as Array<{ id: string; name: string; email: string; unsubToken?: string }>

  let sent = 0
  let failed = 0
  for (const u of users) {
    try {
      const summary = await buildMonthlySummary(u.id, range)
      const unsubscribeUrl = `${config.appWebUrl}/unsubscribe?token=${u.unsubToken ?? ''}`
      await sendMonthlySummary({ name: u.name, email: u.email }, summary, unsubscribeUrl)
      sent++
    } catch (err) {
      failed++
      logger.error({ err, userId: u.id }, 'monthly summary send failed')
    }
  }
  logger.info({ sent, failed, month: range.label }, 'monthly batch complete')
  return { sent, failed }
}

export function startMonthlyScheduler(): void {
  if (!cron.validate(config.monthlyCron)) {
    logger.warn({ cron: config.monthlyCron }, 'invalid MONTHLY_CRON; scheduler disabled')
    return
  }
  cron.schedule(config.monthlyCron, () => void acquireAndRun())
  logger.info({ cron: config.monthlyCron }, 'monthly scheduler started')
}

async function acquireAndRun(): Promise<void> {
  try {
    // Redis SET NX lock so exactly one instance runs the batch. TTL 10 min.
    if (config.redisUrl) {
      const redis = new Redis(config.redisUrl)
      try {
        const ok = await redis.set('lock:monthly-batch', '1', 'PX', 10 * 60 * 1000, 'NX')
        if (ok !== 'OK') {
          logger.info('monthly batch lock held by another instance; skipping')
          return
        }
      } finally {
        redis.disconnect()
      }
    }
    await runMonthlyBatch(new Date())
  } catch (err) {
    logger.error({ err }, 'monthly batch top-level failure')
  }
}
