# Email Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email verification at registration, self-service password reset, and a monthly personalized financial-summary email to the Finwise backend, sent via Resend.

**Architecture:** All logic lives in the Fastify backend (`server/`), which serves both web and desktop-backend modes. A new `server/src/email/` module wraps Resend (with an in-memory outbox when no API key is set, for dev/test), renders HTML templates, and issues/consumes single-use email tokens stored hashed in a new `emailTokens` collection. A `node-cron` job guarded by a Redis lock sends monthly summaries. The web renderer gains verify / forgot / reset / unsubscribe pages plus a Settings opt-in toggle.

**Tech Stack:** Node + Fastify 5, MongoDB (`mongodb` driver), ioredis, Resend SDK, node-cron, Zod. Tests: Vitest + mongodb-memory-server.

## Global Constraints

- Server package is CommonJS (`server/package.json` `"type": "commonjs"`) — use `import`/`export` (tsx/tsc transpiles), no `.mjs`.
- Password hashing MUST stay `scrypt(password, salt, 64)` hex with `salt = randomBytes(16).toString('hex')` — matches `server/src/auth/password.ts` and the desktop client. Do NOT change it.
- DB access is via `col(name)` from `server/src/db.ts`. Errors thrown as `new HttpError(status, message)` from `server/src/errors.ts` (the app's error handler maps these).
- User identity comes only from the auth token, never client input.
- Email tokens: store only SHA-256 hex of the raw token; the raw token appears only in the emailed URL. Verify TTL 24h, reset TTL 1h.
- Links in emails use `config.appWebUrl` as the base.
- All new env vars are optional at boot (no `required(...)`) so existing deploys and tests start without them; when `RESEND_API_KEY` is absent the email client uses the in-memory outbox.

---

## File Structure

**Create (backend):**
- `server/src/email/client.ts` — `sendEmail()`, in-memory outbox for no-key mode + tests.
- `server/src/email/templates.ts` — `verifyEmailHtml`, `resetEmailHtml`, `monthlySummaryHtml`.
- `server/src/email/tokens.ts` — `createEmailToken`, `consumeEmailToken`.
- `server/src/email/send.ts` — `sendVerification`, `sendPasswordReset`, `sendMonthlySummary`.
- `server/src/email/summary.ts` — `buildMonthlySummary`, `prevMonthRange`.
- `server/src/email/scheduler.ts` — `startMonthlyScheduler`, `runMonthlyBatch`.
- `server/src/rateLimit.ts` — `checkRateLimit` (Redis counter).
- `server/test/*.test.ts` — Vitest suites.

**Modify (backend):**
- `server/src/config.ts` — add `appWebUrl`, `emailFrom`, `resendApiKey`, `monthlyCron`.
- `server/src/db.ts` — add `emailTokens` indexes.
- `server/src/auth/service.ts` — `register` sets verify fields + returns pending; `login` blocks unverified; add `verifyEmail`, `requestPasswordReset`, `resetPassword`, `resendVerification`, `setMonthlyOptIn`, `unsubscribeByToken`.
- `server/src/routes/auth.routes.ts` — change `register`, add verify/resend/forgot/reset routes.
- `server/src/routes/email.routes.ts` (create) — unsubscribe + opt-in toggle.
- `server/src/app.ts` — register `emailRoutes`.
- `server/src/server.ts` — call `startMonthlyScheduler()`.
- `server/package.json` — deps + test scripts.

**Modify (frontend):**
- `src/renderer/src/web/electronShim.ts` — verification-aware `register`; add `forgotPassword`, `resetPassword`, `resendVerification`, `verifyEmail`, `setMonthlyOptIn`.
- `src/renderer/src/App.tsx` — routes for `/verify`, `/forgot`, `/reset`.
- `src/renderer/src/pages/VerifyPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` (create).
- `src/renderer/src/pages/LoginPage.tsx` — surface "verify email" + "forgot password" link.
- `src/renderer/src/pages/RegisterPage.tsx` — show "check your email" state.
- `src/renderer/src/pages/SettingsPage.tsx` — monthly opt-in toggle.

---

## Task 1: Test harness + config vars

**Files:**
- Modify: `server/package.json`
- Create: `server/vitest.config.ts`, `server/test/helpers/mongo.ts`
- Modify: `server/src/config.ts`
- Test: `server/test/config.test.ts`

**Interfaces:**
- Produces: `config.appWebUrl: string`, `config.emailFrom: string`, `config.resendApiKey: string`, `config.monthlyCron: string`.
- Produces: test helper `withMongo()` that starts mongodb-memory-server, connects the app's `connectDb`, and returns a teardown.

- [ ] **Step 1: Add dev deps and test scripts**

In `server/package.json`, add to `devDependencies`: `"vitest": "^2.1.8"`, `"mongodb-memory-server": "^10.1.2"`. Add to `dependencies`: `"resend": "^4.0.1"`, `"node-cron": "^3.0.3"`, and `"@types/node-cron": "^3.0.11"` to devDependencies. Add scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```
Run: `cd server && npm install`
Expected: installs without error.

- [ ] **Step 2: Vitest config**

Create `server/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false, // shared in-memory Mongo per file; avoid cross-talk
  },
})
```

- [ ] **Step 3: Write failing config test**

Create `server/test/config.test.ts`:
```ts
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
```

- [ ] **Step 4: Run test, verify it fails**

Run: `cd server && npx vitest run test/config.test.ts`
Expected: FAIL — `config.monthlyCron` is undefined.

- [ ] **Step 5: Add fields to config**

In `server/src/config.ts`, add inside the `config` object (after `redisUrl`):
```ts
  appWebUrl: process.env.APP_WEB_URL ?? 'http://localhost:5173/finwise-app',
  emailFrom: process.env.EMAIL_FROM ?? 'Finwise <no-reply@example.com>',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  monthlyCron: process.env.MONTHLY_CRON ?? '0 8 1 * *',
```

- [ ] **Step 6: Run test, verify it passes**

Run: `cd server && npx vitest run test/config.test.ts`
Expected: PASS.

- [ ] **Step 7: Mongo test helper**

Create `server/test/helpers/mongo.ts`:
```ts
import { MongoMemoryServer } from 'mongodb-memory-server'
import { connectDb, closeDb } from '../../src/db'

export interface MongoHandle {
  stop: () => Promise<void>
}

export async function withMongo(): Promise<MongoHandle> {
  const mem = await MongoMemoryServer.create()
  process.env.MONGO_URI = mem.getUri()
  process.env.JWT_SECRET ??= 'test-secret'
  await connectDb()
  return {
    stop: async () => {
      await closeDb()
      await mem.stop()
    },
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add server/package.json server/package-lock.json server/vitest.config.ts server/test/ server/src/config.ts
git commit -m "test: add vitest harness and email config vars"
```

---

## Task 2: Email client with in-memory outbox

**Files:**
- Create: `server/src/email/client.ts`
- Test: `server/test/email-client.test.ts`

**Interfaces:**
- Produces: `sendEmail(msg: OutboundEmail): Promise<void>` where `OutboundEmail = { to: string; subject: string; html: string }`.
- Produces: `getOutbox(): OutboundEmail[]`, `clearOutbox(): void` (test/dev inspection; populated only when `resendApiKey` is empty).

- [ ] **Step 1: Write failing test**

Create `server/test/email-client.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd server && npx vitest run test/email-client.test.ts`
Expected: FAIL — cannot find `../src/email/client`.

- [ ] **Step 3: Implement client**

Create `server/src/email/client.ts`:
```ts
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
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd server && npx vitest run test/email-client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/email/client.ts server/test/email-client.test.ts
git commit -m "feat(email): resend client with in-memory outbox fallback"
```

---

## Task 3: Email templates

**Files:**
- Create: `server/src/email/templates.ts`
- Test: `server/test/email-templates.test.ts`

**Interfaces:**
- Produces: `verifyEmailHtml(name: string, url: string): string`
- Produces: `resetEmailHtml(name: string, url: string): string`
- Produces: `monthlySummaryHtml(name: string, s: MonthlySummary, unsubscribeUrl: string): string` where `MonthlySummary` is imported from `./summary` (defined in Task 8). Until Task 8 exists, define the type inline here and Task 8 re-exports it. To avoid a cycle, declare the shape in `templates.ts`:

```ts
export interface MonthlySummary {
  monthLabel: string
  income: number
  spending: number
  net: number
  topCategories: Array<{ category: string; amount: number }>
  goals: Array<{ name: string; progressPct: number }>
  upcomingBills: Array<{ name: string; amount: number; dueDate: string }>
}
```

- [ ] **Step 1: Write failing test**

Create `server/test/email-templates.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd server && npx vitest run test/email-templates.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement templates**

Create `server/src/email/templates.ts`:
```ts
export interface MonthlySummary {
  monthLabel: string
  income: number
  spending: number
  net: number
  topCategories: Array<{ category: string; amount: number }>
  goals: Array<{ name: string; progressPct: number }>
  upcomingBills: Array<{ name: string; amount: number; dueDate: string }>
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}
function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
function shell(title: string, inner: string): string {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;padding:24px;color:#1a1a2e">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
  <h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>${inner}
  <p style="color:#8a8a9a;font-size:12px;margin-top:24px">Finwise</p></div></body></html>`
}
function button(url: string, label: string): string {
  return `<a href="${esc(url)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${esc(label)}</a>`
}

export function verifyEmailHtml(name: string, url: string): string {
  return shell('Verify your email', `<p>Hi ${esc(name)}, confirm your email to activate your Finwise account.</p>
    <p style="margin:20px 0">${button(url, 'Verify email')}</p>
    <p style="font-size:12px;color:#8a8a9a">This link expires in 24 hours. If you did not sign up, ignore this email.</p>
    <p style="font-size:12px;color:#8a8a9a">Or paste this link: ${esc(url)}</p>`)
}

export function resetEmailHtml(name: string, url: string): string {
  return shell('Reset your password', `<p>Hi ${esc(name)}, we received a request to reset your Finwise password.</p>
    <p style="margin:20px 0">${button(url, 'Reset password')}</p>
    <p style="font-size:12px;color:#8a8a9a">This link expires in 1 hour. If you did not request this, ignore this email.</p>
    <p style="font-size:12px;color:#8a8a9a">Or paste this link: ${esc(url)}</p>`)
}

export function monthlySummaryHtml(name: string, s: MonthlySummary, unsubscribeUrl: string): string {
  const cats = s.topCategories.length
    ? `<ul>${s.topCategories.map((c) => `<li>${esc(c.category)}: ${money(c.amount)}</li>`).join('')}</ul>`
    : '<p style="color:#8a8a9a">No spending recorded.</p>'
  const goals = s.goals.length
    ? `<ul>${s.goals.map((g) => `<li>${esc(g.name)}: ${g.progressPct}%</li>`).join('')}</ul>`
    : ''
  const bills = s.upcomingBills.length
    ? `<ul>${s.upcomingBills.map((b) => `<li>${esc(b.name)}: ${money(b.amount)} due ${esc(b.dueDate)}</li>`).join('')}</ul>`
    : ''
  return shell(`Your ${s.monthLabel} summary`, `<p>Hi ${esc(name)}, here is how last month went.</p>
    <p><strong>Income:</strong> ${money(s.income)} &nbsp; <strong>Spending:</strong> ${money(s.spending)} &nbsp; <strong>Net:</strong> ${money(s.net)}</p>
    <h3 style="font-size:15px">Top spending</h3>${cats}
    ${goals ? `<h3 style="font-size:15px">Goals</h3>${goals}` : ''}
    ${bills ? `<h3 style="font-size:15px">Upcoming bills</h3>${bills}` : ''}
    <p style="font-size:12px;color:#8a8a9a;margin-top:20px"><a href="${esc(unsubscribeUrl)}" style="color:#8a8a9a">Unsubscribe from monthly emails</a></p>`)
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd server && npx vitest run test/email-templates.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/email/templates.ts server/test/email-templates.test.ts
git commit -m "feat(email): HTML templates for verify, reset, monthly"
```

---

## Task 4: Email token issue/consume

**Files:**
- Create: `server/src/email/tokens.ts`
- Modify: `server/src/db.ts` (indexes)
- Test: `server/test/email-tokens.test.ts`

**Interfaces:**
- Produces: `createEmailToken(type: 'verify' | 'reset', userId: string, email: string): Promise<string>` — returns the raw token.
- Produces: `consumeEmailToken(type: 'verify' | 'reset', rawToken: string): Promise<{ userId: string; email: string }>` — throws `HttpError(400, 'Invalid or expired link')` on any failure; marks the token used atomically.

- [ ] **Step 1: Write failing test**

Create `server/test/email-tokens.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { withMongo, MongoHandle } from './helpers/mongo'
import { createEmailToken, consumeEmailToken } from '../src/email/tokens'

let mongo: MongoHandle
beforeAll(async () => { mongo = await withMongo() })
afterAll(async () => { await mongo.stop() })

describe('email tokens', () => {
  it('round-trips a valid token once', async () => {
    const raw = await createEmailToken('verify', 'u_1', 'a@b.com')
    const res = await consumeEmailToken('verify', raw)
    expect(res).toEqual({ userId: 'u_1', email: 'a@b.com' })
  })
  it('rejects reuse', async () => {
    const raw = await createEmailToken('reset', 'u_2', 'c@d.com')
    await consumeEmailToken('reset', raw)
    await expect(consumeEmailToken('reset', raw)).rejects.toMatchObject({ status: 400 })
  })
  it('rejects wrong type', async () => {
    const raw = await createEmailToken('verify', 'u_3', 'e@f.com')
    await expect(consumeEmailToken('reset', raw)).rejects.toMatchObject({ status: 400 })
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd server && npx vitest run test/email-tokens.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement tokens**

Create `server/src/email/tokens.ts`:
```ts
import { randomBytes, createHash } from 'crypto'
import { col } from '../db'
import { HttpError } from '../errors'

export type EmailTokenType = 'verify' | 'reset'
const TTL_MS: Record<EmailTokenType, number> = { verify: 24 * 60 * 60 * 1000, reset: 60 * 60 * 1000 }

function hash(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export async function createEmailToken(type: EmailTokenType, userId: string, email: string): Promise<string> {
  const raw = randomBytes(32).toString('hex')
  await col('emailTokens').insertOne({
    tokenHash: hash(raw),
    type,
    userId,
    email,
    expiresAt: new Date(Date.now() + TTL_MS[type]),
    usedAt: null,
  })
  return raw
}

export async function consumeEmailToken(
  type: EmailTokenType,
  rawToken: string
): Promise<{ userId: string; email: string }> {
  const doc = await col('emailTokens').findOneAndUpdate(
    { tokenHash: hash(rawToken), type, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { returnDocument: 'after' }
  )
  if (!doc) throw new HttpError(400, 'Invalid or expired link')
  return { userId: doc.userId as string, email: doc.email as string }
}
```

- [ ] **Step 4: Add indexes in db.ts**

In `server/src/db.ts`, add two entries to the `Promise.all([...])` array:
```ts
    db.collection('emailTokens').createIndex({ tokenHash: 1 }),
    db.collection('emailTokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
```

- [ ] **Step 5: Run test, verify it passes**

Run: `cd server && npx vitest run test/email-tokens.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add server/src/email/tokens.ts server/src/db.ts server/test/email-tokens.test.ts
git commit -m "feat(email): single-use hashed email tokens + TTL index"
```

---

## Task 5: send.ts wiring

**Files:**
- Create: `server/src/email/send.ts`
- Test: `server/test/email-send.test.ts`

**Interfaces:**
- Consumes: `sendEmail`, `getOutbox` (Task 2); templates (Task 3).
- Produces: `sendVerification(user: {name:string;email:string}, url: string): Promise<void>`
- Produces: `sendPasswordReset(user: {name:string;email:string}, url: string): Promise<void>`
- Produces: `sendMonthlySummary(user: {name:string;email:string}, s: MonthlySummary, unsubscribeUrl: string): Promise<void>`

- [ ] **Step 1: Write failing test**

Create `server/test/email-send.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd server && npx vitest run test/email-send.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement send.ts**

Create `server/src/email/send.ts`:
```ts
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
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd server && npx vitest run test/email-send.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/email/send.ts server/test/email-send.test.ts
git commit -m "feat(email): send helpers for verify/reset/monthly"
```

---

## Task 6: Auth service — verification + reset logic

**Files:**
- Modify: `server/src/auth/service.ts`
- Test: `server/test/auth-service.test.ts`

**Interfaces:**
- Consumes: `createEmailToken`, `consumeEmailToken` (Task 4); `sendVerification`, `sendPasswordReset` (Task 5); `config.appWebUrl`.
- Produces (new/changed exports in `service.ts`):
  - `register(name, email, password, ua?)` → `Promise<{ status: 'verification_sent' }>` (NO tokens).
  - `login(email, password, ua?)` → unchanged signature, but throws `HttpError(403, 'Please verify your email')` when unverified.
  - `verifyEmail(rawToken, ua?)` → `Promise<AuthResult>` (auto-login).
  - `requestPasswordReset(email)` → `Promise<void>` (always resolves).
  - `resetPassword(rawToken, newPassword)` → `Promise<void>`.
  - `resendVerification(email)` → `Promise<void>` (always resolves).

- [ ] **Step 1: Write failing test**

Create `server/test/auth-service.test.ts`:
```ts
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

  it('login blocked until verified, then allowed', async () => {
    await auth.register('Jithmi', 'j@x.com', 'secret1')
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
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd server && npx vitest run test/auth-service.test.ts`
Expected: FAIL — `register` returns AuthResult, `verifyEmail` undefined.

- [ ] **Step 3: Update service.ts**

In `server/src/auth/service.ts`:

Add imports at top:
```ts
import { config } from '../config'
import { createEmailToken, consumeEmailToken } from '../email/tokens'
import { sendVerification, sendPasswordReset } from '../email/send'
```

Replace the `register` function with:
```ts
export async function register(
  name: string,
  email: string,
  password: string,
  _ua?: string
): Promise<{ status: 'verification_sent' }> {
  const users = col('users')
  if (await users.findOne({ email })) throw new HttpError(409, 'Email already registered')
  const { salt, hash } = await hashPassword(password)
  const id = `u_${Date.now()}`
  const unsubToken = (await import('crypto')).randomBytes(16).toString('hex')
  await users.insertOne({ id, name, email, salt, hash, emailVerified: false, monthlyOptIn: true, unsubToken })
  const raw = await createEmailToken('verify', id, email)
  await sendVerification({ name, email }, `${config.appWebUrl}/verify?token=${raw}`)
  return { status: 'verification_sent' }
}
```

In `login`, after the `verifyPassword` check and before `createSession`, insert:
```ts
  if (doc.emailVerified === false) throw new HttpError(403, 'Please verify your email')
```

Append these new functions:
```ts
export async function verifyEmail(rawToken: string, ua?: string): Promise<AuthResult> {
  const { userId } = await consumeEmailToken('verify', rawToken)
  const doc = await col('users').findOneAndUpdate(
    { id: userId },
    { $set: { emailVerified: true } },
    { returnDocument: 'after' }
  )
  if (!doc) throw new HttpError(404, 'User not found')
  const sessionId = await createSession(doc.id as string, deviceLabelFrom(ua))
  return tokensFor(
    { id: doc.id as string, name: doc.name as string, email: doc.email as string, avatar: (doc.avatar as string | undefined) ?? null },
    sessionId
  )
}

export async function resendVerification(email: string): Promise<void> {
  const doc = await col('users').findOne({ email })
  if (!doc || doc.emailVerified) return
  const raw = await createEmailToken('verify', doc.id as string, email)
  await sendVerification({ name: doc.name as string, email }, `${config.appWebUrl}/verify?token=${raw}`)
}

export async function requestPasswordReset(email: string): Promise<void> {
  const doc = await col('users').findOne({ email })
  if (!doc || doc.emailVerified === false) return
  const raw = await createEmailToken('reset', doc.id as string, email)
  await sendPasswordReset({ name: doc.name as string, email }, `${config.appWebUrl}/reset?token=${raw}`)
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const { userId } = await consumeEmailToken('reset', rawToken)
  const { salt, hash } = await hashPassword(newPassword)
  await col('users').updateOne({ id: userId }, { $set: { salt, hash } })
  await col('sessions').deleteMany({ userId }) // force re-login everywhere
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd server && npx vitest run test/auth-service.test.ts`
Expected: PASS (4 tests). Note login-with-wrong-password returns 401 (unchanged behavior) as asserted.

- [ ] **Step 5: Commit**

```bash
git add server/src/auth/service.ts server/test/auth-service.test.ts
git commit -m "feat(auth): email verification + password reset in service layer"
```

---

## Task 7: Auth routes update

**Files:**
- Modify: `server/src/routes/auth.routes.ts`
- Create: `server/src/rateLimit.ts`
- Test: `server/test/auth-routes.test.ts`

**Interfaces:**
- Consumes: `auth.verifyEmail`, `auth.requestPasswordReset`, `auth.resetPassword`, `auth.resendVerification` (Task 6).
- Produces HTTP routes: `POST /api/auth/verify`, `POST /api/auth/resend-verification`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`; changed `POST /api/auth/register` (201, `{status}`, no cookie).
- Produces: `checkRateLimit(key: string, limit: number, windowSec: number): Promise<boolean>` (true = allowed). Uses Redis if `config.redisUrl` else always allows.

- [ ] **Step 1: Write rateLimit + failing route test**

Create `server/src/rateLimit.ts`:
```ts
import Redis from 'ioredis'
import { config } from './config'

let redis: Redis | null = null
function client(): Redis | null {
  if (!config.redisUrl) return null
  if (!redis) redis = new Redis(config.redisUrl)
  return redis
}

export async function checkRateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const c = client()
  if (!c) return true // no Redis (dev/test) -> do not block
  const k = `rl:${key}`
  const n = await c.incr(k)
  if (n === 1) await c.expire(k, windowSec)
  return n <= limit
}
```

Create `server/test/auth-routes.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd server && npx vitest run test/auth-routes.test.ts`
Expected: FAIL — register still returns tokens/sets cookie; verify route 404.

- [ ] **Step 3: Update routes**

In `server/src/routes/auth.routes.ts`:

Replace the `register` handler body with:
```ts
  app.post('/api/auth/register', async (req, reply) => {
    const body = registerSchema.parse(req.body)
    const res = await auth.register(body.name, body.email, body.password, req.headers['user-agent'])
    reply.code(201)
    return res
  })
```

Add `import { checkRateLimit } from '../rateLimit'` at the top. Add these routes inside `authRoutes` (before the closing brace):
```ts
  app.post('/api/auth/verify', async (req, reply) => {
    const body = z.object({ token: z.string().min(1) }).parse(req.body)
    const res = await auth.verifyEmail(body.token, req.headers['user-agent'])
    setAuthCookie(reply, res.accessToken)
    return res
  })

  app.post('/api/auth/resend-verification', async (req) => {
    const body = z.object({ email: z.string().email() }).parse(req.body)
    const allowed = await checkRateLimit(`resend:${body.email}`, 3, 3600)
    if (allowed) await auth.resendVerification(body.email)
    return { ok: true }
  })

  app.post('/api/auth/forgot-password', async (req) => {
    const body = z.object({ email: z.string().email() }).parse(req.body)
    const allowed = await checkRateLimit(`forgot:${body.email}`, 3, 3600)
    if (allowed) await auth.requestPasswordReset(body.email)
    return { ok: true }
  })

  app.post('/api/auth/reset-password', async (req) => {
    const body = z.object({ token: z.string().min(1), newPassword: z.string().min(6) }).parse(req.body)
    await auth.resetPassword(body.token, body.newPassword)
    return { ok: true }
  })
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd server && npx vitest run test/auth-routes.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/auth.routes.ts server/src/rateLimit.ts server/test/auth-routes.test.ts
git commit -m "feat(auth): verify/resend/forgot/reset routes + rate limiting"
```

---

## Task 8: Monthly summary builder

**Files:**
- Create: `server/src/email/summary.ts`
- Test: `server/test/summary.test.ts`

**Interfaces:**
- Consumes: `col` (db), `MonthlySummary` type (Task 3).
- Produces: `prevMonthRange(now: Date): { start: Date; end: Date; label: string }`.
- Produces: `buildMonthlySummary(userId: string, range: { start: Date; end: Date; label: string }): Promise<MonthlySummary>`.
- Assumes transaction docs shape `{ userId, type: 'income'|'expense', amount: number, category?: string, date: string }` (ISO). Bills `{ userId, name, amount, dueDate: string, paid?: boolean }`. Goals `{ userId, name, currentAmount?: number, targetAmount?: number }`.

- [ ] **Step 1: Write failing test**

Create `server/test/summary.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { withMongo, MongoHandle } from './helpers/mongo'
import { buildMonthlySummary, prevMonthRange } from '../src/email/summary'
import { col } from '../src/db'

let mongo: MongoHandle
beforeAll(async () => { mongo = await withMongo() })
afterAll(async () => { await mongo.stop() })
beforeEach(async () => { await col('transactions').deleteMany({}); await col('goals').deleteMany({}); await col('bills').deleteMany({}) })

describe('prevMonthRange', () => {
  it('computes previous calendar month', () => {
    const r = prevMonthRange(new Date('2026-07-01T08:00:00Z'))
    expect(r.label).toBe('June 2026')
    expect(r.start.toISOString().slice(0, 10)).toBe('2026-06-01')
    expect(r.end.toISOString().slice(0, 10)).toBe('2026-07-01')
  })
})

describe('buildMonthlySummary', () => {
  it('sums income/spending and ranks categories', async () => {
    const range = prevMonthRange(new Date('2026-07-01T08:00:00Z'))
    await col('transactions').insertMany([
      { userId: 'u1', type: 'income', amount: 1000, date: '2026-06-05' },
      { userId: 'u1', type: 'expense', amount: 200, category: 'Food', date: '2026-06-10' },
      { userId: 'u1', type: 'expense', amount: 300, category: 'Rent', date: '2026-06-12' },
      { userId: 'u1', type: 'expense', amount: 50, category: 'Food', date: '2026-06-20' },
      { userId: 'u1', type: 'expense', amount: 999, category: 'Old', date: '2026-05-30' }, // out of range
    ])
    const s = await buildMonthlySummary('u1', range)
    expect(s.income).toBe(1000)
    expect(s.spending).toBe(550)
    expect(s.net).toBe(450)
    expect(s.topCategories[0]).toEqual({ category: 'Rent', amount: 300 })
    expect(s.topCategories.find((c) => c.category === 'Food')?.amount).toBe(250)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd server && npx vitest run test/summary.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement summary**

Create `server/src/email/summary.ts`:
```ts
import { col } from '../db'
import { MonthlySummary } from './templates'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function prevMonthRange(now: Date): { start: Date; end: Date; label: string } {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() // 0-based; "previous month" is m-1
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 1))
  return { start, end, label: `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}` }
}

export async function buildMonthlySummary(
  userId: string,
  range: { start: Date; end: Date; label: string }
): Promise<MonthlySummary> {
  const startIso = range.start.toISOString().slice(0, 10)
  const endIso = range.end.toISOString().slice(0, 10)
  const txns = (await col('transactions')
    .find({ userId, date: { $gte: startIso, $lt: endIso } })
    .toArray()) as Array<{ type?: string; amount?: number; category?: string }>

  let income = 0
  let spending = 0
  const byCat = new Map<string, number>()
  for (const t of txns) {
    const amt = Number(t.amount) || 0
    if (t.type === 'income') income += amt
    else {
      spending += amt
      const cat = t.category || 'Uncategorized'
      byCat.set(cat, (byCat.get(cat) ?? 0) + amt)
    }
  }
  const topCategories = [...byCat.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const goalDocs = (await col('goals').find({ userId }).toArray()) as Array<{ name?: string; currentAmount?: number; targetAmount?: number }>
  const goals = goalDocs.map((g) => ({
    name: g.name || 'Goal',
    progressPct: g.targetAmount ? Math.min(100, Math.round(((g.currentAmount ?? 0) / g.targetAmount) * 100)) : 0,
  }))

  const billDocs = (await col('bills').find({ userId, paid: { $ne: true } }).toArray()) as Array<{ name?: string; amount?: number; dueDate?: string }>
  const upcomingBills = billDocs
    .filter((b) => b.dueDate)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
    .slice(0, 5)
    .map((b) => ({ name: b.name || 'Bill', amount: Number(b.amount) || 0, dueDate: b.dueDate! }))

  return { monthLabel: range.label, income, spending, net: income - spending, topCategories, goals, upcomingBills }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd server && npx vitest run test/summary.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/email/summary.ts server/test/summary.test.ts
git commit -m "feat(email): monthly summary aggregation"
```

---

## Task 9: Monthly scheduler + Redis lock + batch

**Files:**
- Create: `server/src/email/scheduler.ts`
- Modify: `server/src/server.ts`
- Test: `server/test/scheduler.test.ts`

**Interfaces:**
- Consumes: `buildMonthlySummary`, `prevMonthRange` (Task 8); `sendMonthlySummary` (Task 5); `config`.
- Produces: `runMonthlyBatch(now: Date): Promise<{ sent: number; failed: number }>` — iterates verified + opted-in users, per-user try/catch.
- Produces: `startMonthlyScheduler(): void` — schedules cron; each fire acquires a Redis lock then calls `runMonthlyBatch(new Date())`.

- [ ] **Step 1: Write failing test**

Create `server/test/scheduler.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { withMongo, MongoHandle } from './helpers/mongo'
import { runMonthlyBatch } from '../src/email/scheduler'
import { clearOutbox, getOutbox } from '../src/email/client'
import { col } from '../src/db'

let mongo: MongoHandle
beforeAll(async () => { mongo = await withMongo() })
afterAll(async () => { await mongo.stop() })
beforeEach(async () => { clearOutbox(); await col('users').deleteMany({}); await col('transactions').deleteMany({}) })

describe('runMonthlyBatch', () => {
  it('emails only verified + opted-in users', async () => {
    await col('users').insertMany([
      { id: 'a', name: 'A', email: 'a@x.com', emailVerified: true, monthlyOptIn: true, unsubToken: 'ua' },
      { id: 'b', name: 'B', email: 'b@x.com', emailVerified: true, monthlyOptIn: false, unsubToken: 'ub' },
      { id: 'c', name: 'C', email: 'c@x.com', emailVerified: false, monthlyOptIn: true, unsubToken: 'uc' },
    ])
    const res = await runMonthlyBatch(new Date('2026-07-01T08:00:00Z'))
    expect(res.sent).toBe(1)
    const box = getOutbox()
    expect(box).toHaveLength(1)
    expect(box[0].to).toBe('a@x.com')
    expect(box[0].html).toContain('unsubscribe?token=ua')
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd server && npx vitest run test/scheduler.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement scheduler**

Create `server/src/email/scheduler.ts`:
```ts
import cron from 'node-cron'
import Redis from 'ioredis'
import { col } from '../db'
import { config } from '../config'
import { logger } from '../logger'
import { buildMonthlySummary, prevMonthRange } from './summary'
import { sendMonthlySummary } from './send'

export async function runMonthlyBatch(now: Date): Promise<{ sent: number; failed: number }> {
  const range = prevMonthRange(now)
  const users = (await col('users')
    .find({ emailVerified: true, monthlyOptIn: true })
    .toArray()) as Array<{ id: string; name: string; email: string; unsubToken?: string }>

  let sent = 0
  let failed = 0
  for (const u of users) {
    try {
      const summary = await buildMonthlySummary(u.id, range)
      const unsubscribeUrl = `${config.appWebUrl}/unsubscribe?token=${u.unsubToken ?? ''}`
      await sendMonthlySummary({ name: u.name, email: u.email }, summary, unsubscribeUrl)
      sent++
    } catch (err) {
      failed++
      logger.error({ err, userId: u.id }, 'monthly summary send failed')
    }
  }
  logger.info({ sent, failed, month: range.label }, 'monthly batch complete')
  return { sent, failed }
}

export function startMonthlyScheduler(): void {
  if (!cron.validate(config.monthlyCron)) {
    logger.warn({ cron: config.monthlyCron }, 'invalid MONTHLY_CRON; scheduler disabled')
    return
  }
  cron.schedule(config.monthlyCron, () => void acquireAndRun())
  logger.info({ cron: config.monthlyCron }, 'monthly scheduler started')
}

async function acquireAndRun(): Promise<void> {
  // Redis SET NX lock so exactly one instance runs the batch. TTL 10 min.
  if (config.redisUrl) {
    const redis = new Redis(config.redisUrl)
    try {
      const ok = await redis.set('lock:monthly-batch', '1', 'PX', 10 * 60 * 1000, 'NX')
      if (ok !== 'OK') {
        logger.info('monthly batch lock held by another instance; skipping')
        return
      }
    } finally {
      redis.disconnect()
    }
  }
  await runMonthlyBatch(new Date())
}
```

- [ ] **Step 4: Wire into server.ts**

In `server/src/server.ts`, add `import { startMonthlyScheduler } from './email/scheduler'` and, in `main()` after `await app.listen(...)`, add:
```ts
  startMonthlyScheduler()
```

- [ ] **Step 5: Run test, verify it passes**

Run: `cd server && npx vitest run test/scheduler.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/email/scheduler.ts server/src/server.ts server/test/scheduler.test.ts
git commit -m "feat(email): monthly scheduler with Redis lock + batch send"
```

---

## Task 10: Unsubscribe + opt-in routes

**Files:**
- Create: `server/src/routes/email.routes.ts`
- Modify: `server/src/app.ts`
- Modify: `server/src/auth/service.ts` (add `setMonthlyOptIn`, `unsubscribeByToken`)
- Test: `server/test/email-routes.test.ts`

**Interfaces:**
- Produces: `GET /api/email/unsubscribe?token=<unsubToken>` → sets `monthlyOptIn:false`, returns `{ ok: true }`.
- Produces: `POST /api/email/monthly-opt-in` (auth-guarded) `{ optIn: boolean }` → sets the flag for `req.userId`.
- Produces (service.ts): `setMonthlyOptIn(userId: string, optIn: boolean): Promise<void>`, `unsubscribeByToken(token: string): Promise<void>`.

- [ ] **Step 1: Write failing test**

Create `server/test/email-routes.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { withMongo, MongoHandle } from './helpers/mongo'
import { buildApp } from '../src/app'
import { col } from '../src/db'

let mongo: MongoHandle
let app: FastifyInstance
beforeAll(async () => { mongo = await withMongo(); app = await buildApp(); await app.ready() })
afterAll(async () => { await app.close(); await mongo.stop() })
beforeEach(async () => { await col('users').deleteMany({}) })

describe('unsubscribe route', () => {
  it('flips monthlyOptIn to false by token', async () => {
    await col('users').insertOne({ id: 'a', name: 'A', email: 'a@x.com', emailVerified: true, monthlyOptIn: true, unsubToken: 'tok123' })
    const res = await app.inject({ method: 'GET', url: '/api/email/unsubscribe?token=tok123' })
    expect(res.statusCode).toBe(200)
    const u = await col('users').findOne({ id: 'a' })
    expect(u?.monthlyOptIn).toBe(false)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd server && npx vitest run test/email-routes.test.ts`
Expected: FAIL — route 404.

- [ ] **Step 3: Add service functions**

Append to `server/src/auth/service.ts`:
```ts
export async function setMonthlyOptIn(userId: string, optIn: boolean): Promise<void> {
  await col('users').updateOne({ id: userId }, { $set: { monthlyOptIn: optIn } })
}

export async function unsubscribeByToken(token: string): Promise<void> {
  if (!token) return
  await col('users').updateOne({ unsubToken: token }, { $set: { monthlyOptIn: false } })
}
```

- [ ] **Step 4: Create routes**

Create `server/src/routes/email.routes.ts`:
```ts
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import * as auth from '../auth/service'
import { authGuard } from '../middleware/authGuard'

export async function emailRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/email/unsubscribe', async (req) => {
    const token = (req.query as { token?: string }).token ?? ''
    await auth.unsubscribeByToken(token)
    return { ok: true }
  })

  app.post('/api/email/monthly-opt-in', { preHandler: authGuard }, async (req) => {
    const body = z.object({ optIn: z.boolean() }).parse(req.body)
    await auth.setMonthlyOptIn(req.userId, body.optIn)
    return { ok: true }
  })
}
```

- [ ] **Step 5: Register in app.ts**

In `server/src/app.ts`, add `import { emailRoutes } from './routes/email.routes'` and register it next to `authRoutes`:
```ts
  await app.register(emailRoutes)
```

- [ ] **Step 6: Run test, verify it passes**

Run: `cd server && npx vitest run test/email-routes.test.ts`
Expected: PASS.

- [ ] **Step 7: Full backend test run + typecheck**

Run: `cd server && npm test && npm run typecheck`
Expected: all suites PASS, no type errors.

- [ ] **Step 8: Commit**

```bash
git add server/src/routes/email.routes.ts server/src/app.ts server/src/auth/service.ts server/test/email-routes.test.ts
git commit -m "feat(email): unsubscribe + monthly opt-in routes"
```

---

## Task 11: Backfill existing users

**Files:**
- Create: `server/src/scripts/backfill-email-fields.ts`

**Interfaces:**
- Standalone script run once against the live DB to grandfather existing users so they are not locked out by the new `emailVerified` gate.

- [ ] **Step 1: Write the script**

Create `server/src/scripts/backfill-email-fields.ts`:
```ts
import { randomBytes } from 'crypto'
import { connectDb, col, closeDb } from '../db'

async function main(): Promise<void> {
  await connectDb()
  const cursor = col('users').find({ $or: [{ emailVerified: { $exists: false } }, { unsubToken: { $exists: false } }] })
  let n = 0
  for await (const u of cursor) {
    await col('users').updateOne(
      { _id: u._id },
      {
        $set: {
          emailVerified: u.emailVerified ?? true, // grandfather existing accounts
          monthlyOptIn: u.monthlyOptIn ?? true,
          unsubToken: u.unsubToken ?? randomBytes(16).toString('hex'),
        },
      }
    )
    n++
  }
  console.log(`backfilled ${n} users`)
  await closeDb()
}
main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Dry-run locally against a scratch DB (optional) then run against prod**

Run (with the prod `server/.env` present): `cd server && npx tsx src/scripts/backfill-email-fields.ts`
Expected: prints `backfilled N users` (N = current unmigrated users, e.g. 1 for jithmi).

- [ ] **Step 3: Commit**

```bash
git add server/src/scripts/backfill-email-fields.ts
git commit -m "chore(email): backfill script to grandfather existing users"
```

---

## Task 12: Frontend shim — verification-aware auth

**Files:**
- Modify: `src/renderer/src/web/electronShim.ts`

**Interfaces:**
- Consumes: `api` (http.ts), `setToken`, `reconnectSocket`.
- Produces (on the shim `auth` object): `register` now returns `{ ok: true, pending: true }` when the server responds `{ status: 'verification_sent' }`; new methods `verifyEmail(token)`, `resendVerification(email)`, `forgotPassword(email)`, `resetPassword(token, newPassword)`; on `db` a new `setMonthlyOptIn(optIn)`.

- [ ] **Step 1: Update register + add methods**

In `src/renderer/src/web/electronShim.ts`, replace the `auth.register` method with:
```ts
      register: async (name: string, email: string, password: string) => {
        try {
          const r = await api.post<{ status?: string; accessToken?: string; user?: unknown; sessionId?: string }>(
            '/api/auth/register',
            { name, email, password }
          )
          if (r.status === 'verification_sent') return { ok: true, pending: true }
          if (r.accessToken) {
            setToken(r.accessToken)
            reconnectSocket()
          }
          return { ok: true, user: r.user, sessionId: r.sessionId }
        } catch (e) {
          return { ok: false, error: errMsg(e, 'Registration failed') }
        }
      },
      verifyEmail: async (token: string) => {
        try {
          const r = await api.post<{ user: unknown; sessionId: string; accessToken: string }>('/api/auth/verify', { token })
          setToken(r.accessToken)
          reconnectSocket()
          return { ok: true, user: r.user, sessionId: r.sessionId }
        } catch (e) {
          return { ok: false, error: errMsg(e, 'Verification failed') }
        }
      },
      resendVerification: async (email: string) => {
        try { await api.post('/api/auth/resend-verification', { email }); return { ok: true } }
        catch (e) { return { ok: false, error: errMsg(e, 'Could not resend') } }
      },
      forgotPassword: async (email: string) => {
        try { await api.post('/api/auth/forgot-password', { email }); return { ok: true } }
        catch (e) { return { ok: false, error: errMsg(e, 'Request failed') } }
      },
      resetPassword: async (token: string, newPassword: string) => {
        try { await api.post('/api/auth/reset-password', { token, newPassword }); return { ok: true } }
        catch (e) { return { ok: false, error: errMsg(e, 'Reset failed') } }
      },
```

In the `db` object, add:
```ts
      setMonthlyOptIn: (optIn: boolean) => api.post('/api/email/monthly-opt-in', { optIn }).then(() => undefined),
```

- [ ] **Step 2: Build check**

Run: `npm run build:web`
Expected: builds without type errors.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/web/electronShim.ts
git commit -m "feat(web): verification-aware auth shim methods"
```

---

## Task 13: Frontend pages — verify / forgot / reset + routes

**Files:**
- Create: `src/renderer/src/pages/VerifyPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`
- Modify: `src/renderer/src/App.tsx`

**Interfaces:**
- Consumes: `window.electron.auth.verifyEmail/forgotPassword/resetPassword`.
- Read `?token=` from `window.location.search`.

> Note: match the existing pages' styling conventions — open `LoginPage.tsx` first and reuse its container/class patterns. The code below is functional and framework-correct (React + react-router); adapt class names to the app's Tailwind style during implementation.

- [ ] **Step 1: VerifyPage**

Create `src/renderer/src/pages/VerifyPage.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VerifyPage(): JSX.Element {
  const [msg, setMsg] = useState('Verifying your email…')
  const navigate = useNavigate()
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') ?? ''
    if (!token) { setMsg('Missing verification token.'); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).electron.auth.verifyEmail(token).then((r: any) => {
      if (r.ok) { setMsg('Email verified! Redirecting…'); setTimeout(() => navigate('/'), 1200) }
      else setMsg(r.error || 'Verification failed. The link may have expired.')
    })
  }, [navigate])
  return <div style={{ padding: 40, textAlign: 'center' }}><h2>Email verification</h2><p>{msg}</p></div>
}
```

- [ ] **Step 2: ForgotPasswordPage**

Create `src/renderer/src/pages/ForgotPasswordPage.tsx`:
```tsx
import { useState } from 'react'

export default function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (window as any).electron.auth.forgotPassword(email)
    setSent(true) // always show success (no enumeration)
  }
  if (sent) return <div style={{ padding: 40 }}><p>If an account exists for {email}, a reset link is on its way.</p></div>
  return (
    <form onSubmit={submit} style={{ padding: 40, maxWidth: 360 }}>
      <h2>Forgot password</h2>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <button type="submit">Send reset link</button>
    </form>
  )
}
```

- [ ] **Step 3: ResetPasswordPage**

Create `src/renderer/src/pages/ResetPasswordPage.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ResetPasswordPage(): JSX.Element {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const navigate = useNavigate()
  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const token = new URLSearchParams(window.location.search).get('token') ?? ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await (window as any).electron.auth.resetPassword(token, pw)
    if (r.ok) navigate('/login')
    else setErr(r.error || 'Reset failed. The link may have expired.')
  }
  return (
    <form onSubmit={submit} style={{ padding: 40, maxWidth: 360 }}>
      <h2>Set a new password</h2>
      <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" />
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <button type="submit">Reset password</button>
    </form>
  )
}
```

- [ ] **Step 4: Add routes**

In `src/renderer/src/App.tsx`, import the three pages and add routes alongside the existing ones (match the existing `<Route>` structure):
```tsx
<Route path="/verify" element={<VerifyPage />} />
<Route path="/forgot" element={<ForgotPasswordPage />} />
<Route path="/reset" element={<ResetPasswordPage />} />
```

- [ ] **Step 5: Build check**

Run: `npm run build:web`
Expected: builds without type errors.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/pages/VerifyPage.tsx src/renderer/src/pages/ForgotPasswordPage.tsx src/renderer/src/pages/ResetPasswordPage.tsx src/renderer/src/App.tsx
git commit -m "feat(web): verify, forgot-password, reset-password pages"
```

---

## Task 14: Login/Register UX + Settings toggle

**Files:**
- Modify: `src/renderer/src/pages/LoginPage.tsx`, `RegisterPage.tsx`, `SettingsPage.tsx`

**Interfaces:**
- Consumes: shim `auth.register` (returns `{ pending: true }`), `auth.resendVerification`, `db.setMonthlyOptIn`.

> These are UX edits to existing pages. Read each file first and integrate minimally, matching existing state/handler patterns. The required behaviors:

- [ ] **Step 1: RegisterPage — handle pending state**

In `RegisterPage.tsx`, where the register result is handled: if `result.pending` is true, show a "Check your email to verify your account" message (and a "Resend email" button calling `window.electron.auth.resendVerification(email)`) instead of navigating into the app.

- [ ] **Step 2: LoginPage — verify hint + forgot link**

In `LoginPage.tsx`: when login fails with a message matching `/verify/i`, show the message plus a "Resend verification email" action. Add a `<a href>`/router link to `/forgot` ("Forgot password?").

- [ ] **Step 3: SettingsPage — monthly opt-in toggle**

In `SettingsPage.tsx`, add a toggle "Monthly summary emails" that calls `window.electron.db.setMonthlyOptIn(checked)`. Initialize from the user's known state if available; otherwise default the control to on.

- [ ] **Step 4: Build check**

Run: `npm run build:web`
Expected: builds without type errors.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/pages/LoginPage.tsx src/renderer/src/pages/RegisterPage.tsx src/renderer/src/pages/SettingsPage.tsx
git commit -m "feat(web): verification UX on login/register + monthly opt-in toggle"
```

---

## Task 15: Docs + env example + manual E2E

**Files:**
- Modify: `server/.env.example`

- [ ] **Step 1: Document env vars**

Append to `server/.env.example`:
```
# ── Email (Resend) ───────────────────────────────────────────────────────────
# Leave RESEND_API_KEY blank in dev to capture emails to an in-memory outbox.
RESEND_API_KEY=
EMAIL_FROM=Finwise <no-reply@yourdomain.com>
# Base URL of the web app used in email links.
APP_WEB_URL=https://yourdomain.com/finwise-app
# Cron for the monthly summary (default: 08:00 on the 1st).
MONTHLY_CRON=0 8 1 * *
```

- [ ] **Step 2: Manual E2E against local backend**

With `RESEND_API_KEY` unset, run the backend (`cd server && npm run dev`) and the web app (`npm run dev:web` with the proxy). Register a new user; confirm the server log shows "email captured to outbox" with a `/verify?token=` link; paste that link into the browser; confirm auto-login. Then test forgot → reset the same way. Set a real `RESEND_API_KEY` + verified-domain `EMAIL_FROM` to send real mail.

- [ ] **Step 3: Commit**

```bash
git add server/.env.example
git commit -m "docs(email): document Resend + scheduler env vars"
```

---

## Self-Review Notes

- **Spec coverage:** verification (Tasks 4–7,12–14), reset (Tasks 6–7,13–14), monthly summary (Tasks 3,5,8,9), unsubscribe/opt-in (Task 10,14), data model + backfill (Tasks 4,6,11), Resend + outbox (Task 2), rate limiting (Task 7), tests (every backend task). All spec sections map to tasks.
- **Type consistency:** `MonthlySummary` is defined once in `templates.ts` and imported by `summary.ts`, `send.ts`, `scheduler.ts`. `createEmailToken`/`consumeEmailToken` signatures are stable across Tasks 4/6. Shim method names (`verifyEmail`, `forgotPassword`, `resetPassword`, `resendVerification`, `setMonthlyOptIn`) match the routes in Tasks 7/10.
- **Grandfathering:** existing users (jithmi) get `emailVerified: true` via Task 11 so the new login gate never locks them out.
