import { Resend } from 'resend'
import { config } from '../config'
import { logger } from '../logger'

export interface OutboundEmail {
  to: string
  subject: string
  html: string
}

const outbox: OutboundEmail[] = []
export function getOutbox(): OutboundEmail[] {
  return outbox
}
export function clearOutbox(): void {
  outbox.length = 0
}

let resend: Resend | null = null
function client(): Resend | null {
  if (!config.resendApiKey) return null
  if (!resend) resend = new Resend(config.resendApiKey)
  return resend
}

export async function sendEmail(msg: OutboundEmail): Promise<void> {
  const c = client()
  if (!c) {
    // No API key: capture instead of sending (local dev + tests).
    outbox.push(msg)
    logger.info({ to: msg.to, subject: msg.subject }, 'email captured to outbox (no RESEND_API_KEY)')
    return
  }
  const { error } = await c.emails.send({
    from: config.emailFrom,
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
  })
  if (error) throw new Error(`Resend send failed: ${error.message}`)
}
