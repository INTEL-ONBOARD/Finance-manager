import { describe, it, expect } from 'vitest'

describe('config email fields', () => {
  it('exposes email-related defaults', async () => {
    const { config } = await import('../src/config')
    expect(config.appWebUrl).toBe('http://localhost:5173/finwise-app')
    expect(config.emailFrom).toBe('Finwise <no-reply@example.com>')
    expect(config.resendApiKey).toBe('')
    expect(config.monthlyCron).toBe('0 8 1 * *')
  })
})
