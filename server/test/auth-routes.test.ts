import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { withMongo, MongoHandle } from './helpers/mongo'
import { buildApp } from '../src/app'
import { clearOutbox, getOutbox } from '../src/email/client'
import { col } from '../src/db'

let mongo: MongoHandle
let app: FastifyInstance
beforeAll(async () => { mongo = await withMongo(); app = await buildApp(); await app.ready() })
afterAll(async () => { await app.close(); await mongo.stop() })
beforeEach(async () => { clearOutbox(); await col('users').deleteMany({}) })

function tokenFromLastEmail(): string {
  return /token=([a-f0-9]+)/.exec(getOutbox().at(-1)!.html)![1]
}

describe('auth routes', () => {
  it('register returns 201 verification_sent with no auth cookie', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/auth/register',
      payload: { name: 'Jithmi', email: 'j@x.com', password: 'secret1' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json()).toEqual({ status: 'verification_sent' })
    expect(res.cookies.find((c) => c.name === 'fw_token')).toBeUndefined()
  })

  it('verify logs in', async () => {
    await app.inject({ method: 'POST', url: '/api/auth/register', payload: { name: 'J', email: 'j@x.com', password: 'secret1' } })
    const res = await app.inject({ method: 'POST', url: '/api/auth/verify', payload: { token: tokenFromLastEmail() } })
    expect(res.statusCode).toBe(200)
    expect(res.json().accessToken).toBeTruthy()
  })

  it('forgot-password always 200', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/forgot-password', payload: { email: 'nobody@x.com' } })
    expect(res.statusCode).toBe(200)
  })
})
