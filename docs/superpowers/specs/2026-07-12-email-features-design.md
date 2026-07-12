# Email Features: Verification, Password Reset, Monthly Summary

**Date:** 2026-07-12
**Status:** Approved design

## Overview

Add three email-driven features to the Finwise realtime backend (`server/`):

1. **Email verification at registration** — new signups must click an emailed link before they can log in.
2. **Forgot / reset password** — a self-service password reset via an emailed link.
3. **Monthly summary email** — a personalized per-user financial recap sent on the 1st of each month.

Email is sent via **Resend** using a **verified custom domain** (the user owns one). The
backend is a single Fastify instance deployed on the VPS via docker-compose
(`api` + `redis` + `caddy`), with Redis available for locking.

### Scope

- Covers the **backend** (`server/`), which serves both web mode and desktop-backend mode.
- The desktop app's **local-Mongo** signup path (`src/main/index.ts`) is **out of scope** and
  remains unverified — it does not touch the server.
- Web renderer gains new pages: verify, forgot-password, reset-password, unsubscribe, plus a
  Settings toggle for monthly emails.

## Configuration (new env vars)

Add to `server/.env.example`:

| Var | Purpose | Example / default |
|-----|---------|-------------------|
| `RESEND_API_KEY` | Resend API key. If unset, the email client logs to console instead of sending (dev/test). | — |
| `EMAIL_FROM` | From header, using the verified domain. | `Finwise <no-reply@yourdomain.com>` |
| `APP_WEB_URL` | Base URL for links in emails (points at the web app). | `https://yourdomain.com/finwise-app` |
| `MONTHLY_CRON` | Cron expression for the monthly job. | `0 8 1 * *` (08:00, 1st of month) |

TTLs are constants in code: verify tokens 24h, reset tokens 1h.

## Data model

### `users` collection — new fields
- `emailVerified: boolean` — default `false`. Set `true` after the verify link is used.
- `monthlyOptIn: boolean` — default `true`. Controls monthly summary delivery.
- `unsubToken: string` — random hex, used for one-click unsubscribe links.

Existing users (e.g. `jithmi malsha`) are backfilled: `emailVerified: true` (grandfathered so
they are not locked out), `monthlyOptIn: true`, and a generated `unsubToken`.

### New `emailTokens` collection
```
{
  tokenHash: string,   // SHA-256 of the raw token; raw token only lives in the email link
  type: 'verify' | 'reset',
  userId: string,
  email: string,
  expiresAt: Date,     // TTL index -> Mongo auto-deletes expired rows
  usedAt: Date | null  // single-use enforcement
}
```
Indexes: TTL index on `expiresAt`; index on `tokenHash`.

## Email service module (`server/src/email/`)

- `client.ts` — Resend wrapper. When `RESEND_API_KEY` is unset, it becomes a console/no-op
  transport so local dev and tests never need real credentials. Exposes a single
  `sendEmail({ to, subject, html })`.
- `templates.ts` — pure functions returning HTML for `verify`, `reset`, and `monthly` emails.
- `send.ts` — `sendVerification(user, rawToken)`, `sendPasswordReset(user, rawToken)`,
  `sendMonthlySummary(user, summary)`.
- `tokens.ts` — `createEmailToken(type, user)` returns the raw token and stores its hash;
  `consumeEmailToken(type, rawToken)` validates (exists, unexpired, unused), marks used, returns
  the associated user.
- `summary.ts` — `buildMonthlySummary(userId, monthRange)` aggregates the previous calendar
  month's data.

## Flow 1 — Registration with verification

- `POST /api/auth/register` — create user with `emailVerified: false` + `salt`/`hash` +
  `monthlyOptIn: true` + `unsubToken`. Generate a verify token, email
  `${APP_WEB_URL}/verify?token=<raw>`. **Returns no session tokens** — responds
  `{ status: 'verification_sent' }`.
- `POST /api/auth/verify` `{ token }` — `consumeEmailToken('verify', token)`, set
  `emailVerified: true`, then issue session tokens (auto-login).
- `login()` — if `!emailVerified`, reject with `403` and a clear "Please verify your email"
  message (distinct from bad-credentials `401`).
- `POST /api/auth/resend-verification` `{ email }` — re-issue and re-send the link. Rate-limited.
- Web: post-signup "check your email" state; `/verify` landing page that calls the verify endpoint
  and routes into the app on success.

## Flow 2 — Forgot / reset password

- `POST /api/auth/forgot-password` `{ email }` — **always** responds `200` (no enumeration). If the
  account exists and is verified, create a reset token and email
  `${APP_WEB_URL}/reset?token=<raw>`.
- `POST /api/auth/reset-password` `{ token, newPassword }` — `consumeEmailToken('reset', token)`,
  update `salt`/`hash`. Invalidate the user's existing sessions (delete their `sessions` rows) so a
  leaked old password can't ride an existing session.
- Web: `/forgot` (enter email) and `/reset` (set new password) pages.

## Flow 3 — Monthly summary email

- `server/src/email/scheduler.ts` — registers a `node-cron` job at `MONTHLY_CRON` when the app
  starts. On fire, acquire a Redis lock via `SET <key> <val> NX PX <ttl>`; only the holder runs the
  batch (safe under multiple instances).
- For each user with `emailVerified: true` AND `monthlyOptIn: true`: `buildMonthlySummary` over the
  **previous calendar month** — income vs spending total, top spending categories, goal progress,
  upcoming bills. Render via the `monthly` template and send. Each user is wrapped in `try/catch`;
  failures are logged and do not stop the batch. Sends are batched/paced to respect Resend limits.
- **Unsubscribe:** every monthly email includes
  `${APP_WEB_URL}/unsubscribe?token=<unsubToken>`. `GET /api/email/unsubscribe?token=` sets
  `monthlyOptIn: false`. A Settings toggle offers the same control in-app.

## Error handling

- **Register email failure:** the user row is created (email is unique, so retry is idempotent); the
  response directs the user to "resend verification" rather than failing hard.
- **Forgot/reset:** generic responses; never reveal whether an email exists.
- **Monthly:** per-user isolation with structured logging; one bad send never aborts the run.
- **Rate limiting:** Redis counter on `forgot-password` and `resend-verification` to curb abuse.

## Testing

- **Unit:** email token create/consume/expiry/single-use; monthly-summary aggregation math;
  template rendering snapshots.
- **Integration:** full `register → verify → login` and `forgot → reset` flows against a **mock
  email transport** that captures messages (no real sends). Assert unverified login is rejected.
- **Monthly:** run the job against seeded data with the mock transport; assert only
  verified + opted-in users receive mail and content is correct; assert the Redis lock prevents a
  double run.

## Out of scope / future

- Desktop local-Mongo signup verification.
- HTML email design polish beyond a clean, readable template.
- Per-user send-time personalization / timezone-aware scheduling (job runs once at server time).
