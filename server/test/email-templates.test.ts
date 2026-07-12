import { describe, it, expect } from 'vitest'
import { verifyEmailHtml, resetEmailHtml, monthlySummaryHtml } from '../src/email/templates'

describe('email templates', () => {
  it('verify email contains name and link', () => {
    const html = verifyEmailHtml('Jithmi', 'https://x/verify?token=abc')
    expect(html).toContain('Jithmi')
    expect(html).toContain('https://x/verify?token=abc')
  })
  it('reset email contains the link', () => {
    expect(resetEmailHtml('Jithmi', 'https://x/reset?token=abc')).toContain('https://x/reset?token=abc')
  })
  it('monthly email shows totals and unsubscribe link', () => {
    const html = monthlySummaryHtml('Jithmi', {
      monthLabel: 'June 2026', income: 1000, spending: 400, net: 600,
      topCategories: [{ category: 'Food', amount: 200 }], goals: [], upcomingBills: [],
    }, 'https://x/unsubscribe?token=u')
    expect(html).toContain('June 2026')
    expect(html).toContain('Food')
    expect(html).toContain('https://x/unsubscribe?token=u')
  })
})
