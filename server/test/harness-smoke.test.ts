import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { withMongo, MongoHandle } from './helpers/mongo'
import { col } from '../src/db'

let mongo: MongoHandle
beforeAll(async () => { mongo = await withMongo() })
afterAll(async () => { await mongo.stop() })

describe('withMongo harness', () => {
  it('connects to the in-memory server and round-trips a doc', async () => {
    await col('smoke').insertOne({ ok: true })
    const found = await col('smoke').findOne({ ok: true })
    expect(found?.ok).toBe(true)
  })
})
