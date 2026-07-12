import { describe, it, expect, beforeEach } from 'vitest'
import { clearOutbox, getOutbox } from '../src/email/client'
import { sendVerification } from '../src/email/send'

describe('send helpers', () => {
  beforeEach(() => clearOutbox())
  it('sendVerification composes subject + html', async () => {
    await sendVerification({ name: 'Jithmi', email: 'a@b.com' }, 'https://x/verify?token=t')
    const box = getOutbox()
    expect(box[0].to).toBe('a@b.com')
    expect(box[0].subject).toMatch(/verify/i)
    expect(box[0].html).toContain('https://x/verify?token=t')
  })
})
