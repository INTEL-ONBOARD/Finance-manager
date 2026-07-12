import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { withMongo, MongoHandle } from './helpers/mongo'
import { runMonthlyBatch } from '../src/email/scheduler'
import { clearOutbox, getOutbox } from '../src/email/client'
import { col } from '../src/db'

let mongo: MongoHandle
beforeAll(async () => { mongo = await withMongo() })
afterAll(async () => { await mongo.stop() })
beforeEach(async () => { clearOutbox(); await col('users').deleteMany({}); await col('transactions').deleteMany({}) })

describe('runMonthlyBatch', () => {
  it('emails only verified + opted-in users', async () => {
    await col('users').insertMany([
      { id: 'a', name: 'A', email: 'a@x.com', emailVerified: true, monthlyOptIn: true, unsubToken: 'ua' },
      { id: 'b', name: 'B', email: 'b@x.com', emailVerified: true, monthlyOptIn: false, unsubToken: 'ub' },
      { id: 'c', name: 'C', email: 'c@x.com', emailVerified: false, monthlyOptIn: true, unsubToken: 'uc' },
    ])
    const res = await runMonthlyBatch(new Date('2026-07-01T08:00:00Z'))
    expect(res.sent).toBe(1)
    const box = getOutbox()
    expect(box).toHaveLength(1)
    expect(box[0].to).toBe('a@x.com')
    expect(box[0].html).toContain('unsubscribe?token=ua')
  })
})
