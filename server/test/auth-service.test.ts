import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { withMongo, MongoHandle } from './helpers/mongo'
import { clearOutbox, getOutbox } from '../src/email/client'
import * as auth from '../src/auth/service'
import { col } from '../src/db'

let mongo: MongoHandle
beforeAll(async () => { mongo = await withMongo() })
afterAll(async () => { await mongo.stop() })
beforeEach(async () => { clearOutbox(); await col('users').deleteMany({}) })

function tokenFromLastEmail(): string {
  const html = getOutbox().at(-1)!.html
  return /token=([a-f0-9]+)/.exec(html)![1]
}

describe('register + verify + login', () => {
  it('register sends verification and does not log in', async () => {
    const res = await auth.register('Jithmi', 'j@x.com', 'secret1', 'UA')
    expect(res).toEqual({ status: 'verification_sent' })
    expect(getOutbox()).toHaveLength(1)
    const user = await col('users').findOne({ email: 'j@x.com' })
    expect(user?.emailVerified).toBe(false)
    expect(user?.monthlyOptIn).toBe(true)
    expect(typeof user?.unsubToken).toBe('string')
  })

  it('stores the chosen avatar at register and returns it after verify', async () => {
    await auth.register('Jithmi', 'j@x.com', 'secret1', 'UA', '/avatars/monster_3.png')
    const user = await col('users').findOne({ email: 'j@x.com' })
    expect(user?.avatar).toBe('/avatars/monster_3.png')
    const authed = await auth.verifyEmail(tokenFromLastEmail())
    expect(authed.user.avatar).toBe('/avatars/monster_3.png')
  })

  it('login blocked until verified, then allowed', async () => {
    await auth.register('Jithmi', 'j@x.com', 'secret1')
    await expect(auth.login('j@x.com', 'wrongpass')).rejects.toMatchObject({ status: 401 })
    await expect(auth.login('j@x.com', 'secret1')).rejects.toMatchObject({ status: 403 })
    const authed = await auth.verifyEmail(tokenFromLastEmail())
    expect(authed.user.email).toBe('j@x.com')
    const ok = await auth.login('j@x.com', 'secret1')
    expect(ok.accessToken).toBeTruthy()
  })
})

describe('password reset', () => {
  it('forgot -> reset changes the password', async () => {
    await auth.register('Jithmi', 'j@x.com', 'secret1')
    await auth.verifyEmail(tokenFromLastEmail())
    clearOutbox()
    await auth.requestPasswordReset('j@x.com')
    const reset = tokenFromLastEmail()
    await auth.resetPassword(reset, 'newpass9')
    await expect(auth.login('j@x.com', 'secret1')).rejects.toMatchObject({ status: 401 })
    const ok = await auth.login('j@x.com', 'newpass9')
    expect(ok.accessToken).toBeTruthy()
  })

  it('forgot for unknown email resolves without sending', async () => {
    await auth.requestPasswordReset('nobody@x.com')
    expect(getOutbox()).toHaveLength(0)
  })
})
