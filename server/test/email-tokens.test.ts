import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { withMongo, MongoHandle } from './helpers/mongo'
import { createEmailToken, consumeEmailToken } from '../src/email/tokens'

let mongo: MongoHandle
beforeAll(async () => { mongo = await withMongo() })
afterAll(async () => { await mongo.stop() })

describe('email tokens', () => {
  it('round-trips a valid token once', async () => {
    const raw = await createEmailToken('verify', 'u_1', 'a@b.com')
    const res = await consumeEmailToken('verify', raw)
    expect(res).toEqual({ userId: 'u_1', email: 'a@b.com' })
  })
  it('rejects reuse', async () => {
    const raw = await createEmailToken('reset', 'u_2', 'c@d.com')
    await consumeEmailToken('reset', raw)
    await expect(consumeEmailToken('reset', raw)).rejects.toMatchObject({ status: 400 })
  })
  it('rejects wrong type', async () => {
    const raw = await createEmailToken('verify', 'u_3', 'e@f.com')
    await expect(consumeEmailToken('reset', raw)).rejects.toMatchObject({ status: 400 })
  })
})
