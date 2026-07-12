import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { withMongo, MongoHandle } from './helpers/mongo'
import { buildMonthlySummary, prevMonthRange } from '../src/email/summary'
import { col } from '../src/db'

let mongo: MongoHandle
beforeAll(async () => { mongo = await withMongo() })
afterAll(async () => { await mongo.stop() })
beforeEach(async () => { await col('transactions').deleteMany({}); await col('goals').deleteMany({}); await col('bills').deleteMany({}) })

describe('prevMonthRange', () => {
  it('computes previous calendar month', () => {
    const r = prevMonthRange(new Date('2026-07-01T08:00:00Z'))
    expect(r.label).toBe('June 2026')
    expect(r.start.toISOString().slice(0, 10)).toBe('2026-06-01')
    expect(r.end.toISOString().slice(0, 10)).toBe('2026-07-01')
  })
})

describe('buildMonthlySummary', () => {
  it('sums income/spending and ranks categories', async () => {
    const range = prevMonthRange(new Date('2026-07-01T08:00:00Z'))
    await col('transactions').insertMany([
      { userId: 'u1', type: 'income', amount: 1000, date: '2026-06-05' },
      { userId: 'u1', type: 'expense', amount: 200, category: 'Food', date: '2026-06-10' },
      { userId: 'u1', type: 'expense', amount: 300, category: 'Rent', date: '2026-06-12' },
      { userId: 'u1', type: 'expense', amount: 50, category: 'Food', date: '2026-06-20' },
      { userId: 'u1', type: 'expense', amount: 999, category: 'Old', date: '2026-05-30' }, // out of range
    ])
    const s = await buildMonthlySummary('u1', range)
    expect(s.income).toBe(1000)
    expect(s.spending).toBe(550)
    expect(s.net).toBe(450)
    expect(s.topCategories[0]).toEqual({ category: 'Rent', amount: 300 })
    expect(s.topCategories.find((c) => c.category === 'Food')?.amount).toBe(250)
  })
})
