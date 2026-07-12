import { describe, it, expect, beforeEach } from 'vitest'
import { sendEmail, getOutbox, clearOutbox } from '../src/email/client'

describe('email client (no API key -> outbox)', () => {
  beforeEach(() => clearOutbox())

  it('captures sent mail in the outbox', async () => {
    await sendEmail({ to: 'a@b.com', subject: 'Hi', html: '<p>x</p>' })
    const box = getOutbox()
    expect(box).toHaveLength(1)
    expect(box[0]).toMatchObject({ to: 'a@b.com', subject: 'Hi' })
  })
})
