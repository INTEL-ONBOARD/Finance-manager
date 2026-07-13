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
beforeEach(async () => {
  clearOutbox()
  await col('users').deleteMany({})
  await col('sessions').deleteMany({})
  await col('messages').deleteMany({})
})

function tokenFromLastEmail(): string {
  return /token=([a-f0-9]+)/.exec(getOutbox().at(-1)!.html)![1]
}

async function registerAndLogin(name: string, email: string) {
  await app.inject({
    method: 'POST', url: '/api/auth/register',
    payload: { name, email, password: 'secret123' },
  })
  const res = await app.inject({
    method: 'POST', url: '/api/auth/verify',
    payload: { token: tokenFromLastEmail() },
  })
  return res.json() as { accessToken: string; user: { id: string } }
}

describe('session revocation', () => {
  it('logout revokes the session so the old access token is rejected afterward', async () => {
    const { accessToken } = await registerAndLogin('Jithmi', 'j@x.com')
    const before = await app.inject({
      method: 'GET', url: '/api/settings',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(before.statusCode).toBe(200)

    const logoutRes = await app.inject({
      method: 'POST', url: '/api/auth/logout',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(logoutRes.statusCode).toBe(200)

    const after = await app.inject({
      method: 'GET', url: '/api/settings',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(after.statusCode).toBe(401)
  })

  it('deleting a session via the sessions API revokes its token immediately', async () => {
    const { accessToken } = await registerAndLogin('Kasun', 'k@x.com')
    const sessions = await app.inject({
      method: 'GET', url: '/api/sessions',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    const [{ sessionId }] = sessions.json() as Array<{ sessionId: string }>

    const del = await app.inject({
      method: 'DELETE', url: `/api/sessions/${sessionId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(del.statusCode).toBe(200)

    const after = await app.inject({
      method: 'GET', url: '/api/settings',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    expect(after.statusCode).toBe(401)
  })
})

describe('chat authorization', () => {
  it('rejects reading a DM conversation the caller is not a participant of', async () => {
    const a = await registerAndLogin('Alice', 'alice@x.com')
    const b = await registerAndLogin('Bob', 'bob@x.com')
    const c = await registerAndLogin('Carol', 'carol@x.com')
    const dmId = `dm_${[b.user.id, c.user.id].sort().join('_')}`

    const res = await app.inject({
      method: 'GET', url: `/api/chat/messages?conversationId=${dmId}`,
      headers: { authorization: `Bearer ${a.accessToken}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('stamps the sender from the verified token, ignoring a spoofed senderId in the body', async () => {
    const a = await registerAndLogin('Alice', 'alice@x.com')
    const b = await registerAndLogin('Bob', 'bob@x.com')
    const dmId = `dm_${[a.user.id, b.user.id].sort().join('_')}`

    const res = await app.inject({
      method: 'POST', url: '/api/chat/messages',
      headers: { authorization: `Bearer ${a.accessToken}` },
      payload: { conversationId: dmId, body: 'hi', senderId: b.user.id, senderName: 'Bob' },
    })
    expect(res.statusCode).toBe(200)

    const stored = await col('messages').findOne({ conversationId: dmId })
    expect(stored?.senderId).toBe(a.user.id)
    expect(stored?.senderName).toBe('Alice')
  })
})
