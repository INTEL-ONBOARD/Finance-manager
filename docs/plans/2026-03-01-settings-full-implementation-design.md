# Settings Full Implementation Design

**Date:** 2026-03-01
**Status:** Approved

## Context

The Settings page in Finwise has complete UI for all sections (Profile, Notifications, Security, Billing, Updates) but most features are non-functional. Profile and notification changes are local component state only — they reset on app reload. Security actions (Change Password, Active Sessions) have no implementation. This design makes all settings sections fully functional.

## Goals

- Profile settings (name, email, currency, timezone) persist to MongoDB
- Notification preferences persist to MongoDB
- Change Password works using the existing scrypt auth system
- Active Sessions shows per-login detail with revoke capability
- 2FA marked as "Coming Soon" (out of scope)
- Billing/Upgrade remains display-only (no payment backend)
- Updates section already works — no changes needed

---

## Architecture

### New MongoDB Collections

**`settings`** — one document per user, upserted on every save:
```json
{
  "userId": "u_xxx",
  "name": "K. Wenuja",
  "email": "kwenuja@email.com",
  "currency": "USD",
  "timezone": "Asia/Colombo",
  "notifs": {
    "billReminders": true,
    "goalMilestones": true,
    "largeTransactions": true,
    "monthlySummary": true,
    "weeklyDigest": false
  }
}
```

**`sessions`** — one document per login event:
```json
{
  "sessionId": "s_xxx",
  "userId": "u_xxx",
  "deviceLabel": "macOS",
  "createdAt": "2026-03-01T09:45:00Z",
  "lastActiveAt": "2026-03-01T10:30:00Z"
}
```

### IPC Channels to Add

| Channel | Direction | Purpose |
|---|---|---|
| `db:settings:get` | renderer→main | Fetch user's settings doc |
| `db:settings:save` | renderer→main | Upsert full settings doc |
| `auth:changePassword` | renderer→main | Verify old pw + set new hash |
| `db:sessions:list` | renderer→main | List all sessions for user |
| `db:sessions:revoke` | renderer→main | Delete a session by sessionId |

### Data Flow

**Profile / Notifications:**
1. On Settings mount → `db:settings:get(userId)` → populate form state
2. On "Save Changes" → `db:settings:save(userId, settingsDoc)` → optimistic UI feedback
3. If name/email changed → also update `users` collection so AuthContext name reflects the change

**Change Password:**
1. User enters old password + new password (+ confirm)
2. `auth:changePassword(userId, oldPassword, newPassword)` → main verifies old hash, recomputes scrypt hash, updates `users` doc
3. Returns `{ ok: true }` or `{ ok: false, error: 'Wrong password' }`

**Active Sessions:**
1. On login (`auth:login` success) → create session doc in `sessions` collection with `sessionId`, `userId`, platform OS, timestamps
2. Store `sessionId` in AuthContext (alongside user)
3. Security section renders → `db:sessions:list(userId)` → show sessions sorted by `lastActiveAt` desc
4. Current session marked with "Current" badge (matched by `sessionId` from AuthContext)
5. "Revoke" button → `db:sessions:revoke(userId, sessionId)` → deletes that session doc

---

## Files to Modify

### Main Process
- `src/main/index.ts` — Add 5 new IPC handlers: `db:settings:get`, `db:settings:save`, `auth:changePassword`, `db:sessions:list`, `db:sessions:revoke`; create session on `auth:login`; add `sessions` and `settings` to `clearUserData` handler

### Preload
- `src/preload/index.ts` — Expose new channels: `window.electron.db.settings.{get, save}`, `window.electron.auth.changePassword`, `window.electron.db.sessions.{list, revoke}`

### Types
- `src/renderer/src/types/electron.d.ts` — Add TypeScript types for all new channels

### Auth Context
- `src/renderer/src/context/AuthContext.tsx` — Add `sessionId` to User interface; set `sessionId` on login/register; persist to localStorage alongside user

### Settings Page
- `src/renderer/src/pages/SettingsPage.tsx` — Wire all sections to real IPC calls:
  - Profile: load on mount, save on button click, update users collection
  - Notifications: load on mount, save on toggle change (debounced) or explicit save
  - Security → Change Password: modal/inline form with old+new+confirm fields, call `auth:changePassword`
  - Security → Active Sessions: load on mount, render session list with Current badge + Revoke buttons
  - Security → 2FA: Replace button with "Coming Soon" badge

---

## UI Details

### Change Password
Inline expandable form under the "Change Password" button (no modal):
- Old Password field
- New Password field
- Confirm New Password field
- Client-side validation: new ≠ old, confirm matches, min 8 chars
- Submit calls `auth:changePassword` → shows success toast or inline error

### Active Sessions
Session cards showing:
- Device OS label (e.g. "macOS", "Windows")
- Login time: "Logged in Mar 1, 2026 at 9:45 AM"
- Last active: "Last active 10 minutes ago"
- "Current" green badge for active session
- "Revoke" button (disabled for current session)

### Profile Save
- "Save Changes" button triggers save to both `settings` + `users` collections
- Brief "Saved" checkmark feedback (already implemented in UI)

### Notification Preferences
- Saves automatically on each toggle change (500ms debounce) — no explicit save button needed
- Or: keep explicit "Save" pattern for consistency with Profile

---

## Seeding

No seeding needed. Settings and sessions collections start empty; settings are created on first save, sessions on first login.

---

## Verification

1. Register or log in as a user
2. Go to Settings → Profile → change name/currency → Save Changes → quit and reopen app → verify name persists
3. Go to Settings → Notifications → toggle a preference → quit and reopen → verify toggle state persists
4. Go to Settings → Security → Change Password → enter wrong old password → verify error message
5. Change Password with correct old password → verify success → log out → log in with new password
6. Check Active Sessions shows current session with "Current" badge
7. Log in from a second account → revoke a session → verify it disappears from list
8. Clear All My Data → verify settings + sessions docs also cleared
