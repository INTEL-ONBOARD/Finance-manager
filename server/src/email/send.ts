import { sendEmail } from './client'
import { verifyEmailHtml, resetEmailHtml, monthlySummaryHtml, MonthlySummary } from './templates'

interface Recipient {
  name: string
  email: string
}

export async function sendVerification(user: Recipient, url: string): Promise<void> {
  await sendEmail({ to: user.email, subject: 'Verify your Finwise email', html: verifyEmailHtml(user.name, url) })
}

export async function sendPasswordReset(user: Recipient, url: string): Promise<void> {
  await sendEmail({ to: user.email, subject: 'Reset your Finwise password', html: resetEmailHtml(user.name, url) })
}

export async function sendMonthlySummary(user: Recipient, s: MonthlySummary, unsubscribeUrl: string): Promise<void> {
  await sendEmail({
    to: user.email,
    subject: `Your ${s.monthLabel} Finwise summary`,
    html: monthlySummaryHtml(user.name, s, unsubscribeUrl),
  })
}
