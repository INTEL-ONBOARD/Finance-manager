import { describe, it, expect } from 'vitest'

describe('config email fields', () => {
  it('exposes email-related defaults', async () => {
    process.env.MONGO_URI ??= 'mongodb://localhost:27017'
    process.env.JWT_SECRET ??= 'test-secret'
    const { config } = await import('../src/config')
    expect(config.monthlyCron).toBe('0 8 1 * *')
    expect(typeof config.appWebUrl).toBe('string')
    expect(typeof config.emailFrom).toBe('string')
    expect(typeof config.resendApiKey).toBe('string')
  })
})
