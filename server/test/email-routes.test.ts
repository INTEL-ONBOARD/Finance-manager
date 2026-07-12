import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { withMongo, MongoHandle } from './helpers/mongo'
import { buildApp } from '../src/app'
import { col } from '../src/db'

let mongo: MongoHandle
let app: FastifyInstance
beforeAll(async () => { mongo = await withMongo(); app = await buildApp(); await app.ready() })
afterAll(async () => { await app.close(); await mongo.stop() })
beforeEach(async () => { await col('users').deleteMany({}) })

describe('unsubscribe route', () => {
  it('flips monthlyOptIn to false by token', async () => {
    await col('users').insertOne({ id: 'a', name: 'A', email: 'a@x.com', emailVerified: true, monthlyOptIn: true, unsubToken: 'tok123' })
    const res = await app.inject({ method: 'GET', url: '/api/email/unsubscribe?token=tok123' })
    expect(res.statusCode).toBe(200)
    const u = await col('users').findOne({ id: 'a' })
    expect(u?.monthlyOptIn).toBe(false)
  })
})
