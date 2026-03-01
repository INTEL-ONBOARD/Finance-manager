# Onboarding Flow Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan from this design.

**Goal:** Replace the direct post-registration redirect to `/` with a 4-step onboarding wizard at `/onboarding` that guides new users through account setup, first transactions, and an app tour before landing on the dashboard.

**Architecture:** Dedicated `/onboarding` route (PrivateRoute-guarded) with a single `OnboardingPage` component that manages a `step` integer (1–4). Each step is a child component. A `localStorage` flag `finmate-onboarded` gates the flow — set to `'false'` by `RegisterPage` after registration, set to `'true'` when the user finishes or skips to the tour exit. The `/onboarding` route redirects to `/` if the flag is already `'true'` or missing.

**Tech Stack:** React 19, react-router-dom v7 (HashRouter), Framer Motion, Tailwind CSS v4, Lucide icons, existing IPC channels (`db.accounts.add`, `db.transactions.add`)

---

## Step Overview

| # | Name | Required | Notes |
|---|------|----------|-------|
| 1 | Welcome | Yes | Shows avatar + name, greeting. No data entry. |
| 2 | Add Account | No (skippable) | Simplified account form → `db.accounts.add` |
| 3 | Add Transactions | No (skippable) | Manual (up to 3) + CSV upload with preview |
| 4 | App Tour | Yes (exit gate) | 5-card welcome slideshow → "Go to Dashboard" |

---

## New User Flag

- `RegisterPage.handleSubmit`: After `register()` succeeds, call `localStorage.setItem('finmate-onboarded', 'false')` then `navigate('/onboarding')`.
- `OnboardingPage` mount: if `localStorage.getItem('finmate-onboarded') !== 'false'`, redirect to `/`.
- Step 4 "Go to Dashboard": `localStorage.setItem('finmate-onboarded', 'true')` then `navigate('/')`.

---

## Route Change

In `App.tsx`, add:
```tsx
{ path: '/onboarding', element: <PrivateRoute><OnboardingPage /></PrivateRoute> }
```
Import `OnboardingPage` from `./pages/OnboardingPage`.

---

## File Structure

```
src/renderer/src/pages/OnboardingPage.tsx        ← main wizard controller
src/renderer/src/components/onboarding/
  StepWelcome.tsx       ← Step 1
  StepAddAccount.tsx    ← Step 2
  StepAddTransactions.tsx  ← Step 3
  StepTour.tsx          ← Step 4
```

---

## OnboardingPage Layout

Full-screen layout matching the Register/Login pages:
- **Left panel** (hidden on small screens): same green gradient as RegisterPage — `linear-gradient(145deg, #1a2a0a, #1e3a10, #0f2208)`, dot grid overlay, Hexagon logo + tagline
- **Right panel**: progress indicator + step content + navigation buttons

**Progress indicator** (top of right panel):
```
Step 2 of 4   [● ● ○ ○]   Add your first account
```
Four dots, filled up to current step. Step 1 shows no dots (just a welcome heading).

**Navigation buttons** (bottom of right panel):
- Step 1: single "Let's get started →" button
- Steps 2–3: "← Back" (ghost) + "Skip for now" (ghost) + "Continue →" (primary)
- Step 4: internal prev/next within the slideshow; final slide has "Go to Dashboard →" (primary, replaces all nav)

**Animations:** `AnimatePresence` + `motion.div` — slide left/right on step change (x: ±30, opacity: 0→1, 300ms ease).

---

## Step 1 — Welcome (`StepWelcome`)

Props: `{ name: string; avatar?: string; onNext: () => void }`

Content:
- Large avatar image (80px) centered
- `"Welcome, {name}! 🎉"` heading
- Short copy: `"Let's get your finances set up. We'll add your accounts, log some transactions, and show you around."`
- Single CTA: `"Let's get started →"`

---

## Step 2 — Add Account (`StepAddAccount`)

Props: `{ onNext: () => void; onSkip: () => void; onBack: () => void }`

Form fields:
- Account name (text input)
- Account type (select: Checking / Savings / Credit / Investment / Loan)
- Opening balance (number input)
- Currency auto-filled from settings (read-only display)

On submit:
```ts
const id = crypto.randomUUID();
const color = ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)];
await window.electron!.db.accounts.add(userId, { id, name, type, balance, color });
```
Then call `onNext()`.

ACCOUNT_COLORS: `['#84cc16','#3b82f6','#a855f7','#f59e0b','#ef4444','#14b8a6']`

Error handling: show inline error string if IPC throws.

---

## Step 3 — Add Transactions (`StepAddTransactions`)

Props: `{ onNext: () => void; onSkip: () => void; onBack: () => void }`

**Two tabs:** "Enter manually" | "Upload CSV"

### Manual tab
Up to 3 transaction rows. Each row:
- Description (text)
- Amount (number — positive = income, negative = expense; show a +/- toggle)
- Category (select, same categories as `TransactionCategory` type)
- Date (date input, defaults to today)

"Add another" link (disabled after 3). On Continue: save each row via `db.transactions.add(userId, tx)`.

### CSV tab
- Drag-and-drop zone with dashed border + upload icon
- Accepts `.csv` files; reads via `FileReader`
- Expected columns: `name,amount,category,date` (show example format hint)
- After parse: show preview table (max 10 rows) with a "Confirm import" button
- On confirm: bulk-add via `Promise.all(rows.map(r => db.transactions.add(userId, r)))`
- Parse errors: show friendly message, don't crash

---

## Step 4 — App Tour (`StepTour`)

Props: `{ onFinish: () => void }`

Internal state: `slideIndex` (0–4).

5 slides:

| # | Icon | Title | Body |
|---|------|-------|------|
| 0 | LayoutDashboard | Your Dashboard | Get a bird's-eye view of your finances — income, expenses, net worth, and savings at a glance. |
| 1 | ArrowLeftRight | Transactions | Log every income and expense. Filter, search, and see where your money actually goes. |
| 2 | PiggyBank | Budget & Bills | Set spending limits per category and track recurring bills so nothing slips through the cracks. |
| 3 | Target | Savings Goals | Define goals with deadlines. Watch your progress bars fill as you contribute over time. |
| 4 | Sparkles | AI Assistant | Ask your AI chat anything — spending breakdowns, saving advice, or financial Q&A. |

Slide layout: centered card (max-w-sm), icon in a rounded box, title, body text, dot indicators, Prev/Next buttons. Final slide replaces Next with **"Go to Dashboard →"**.

On "Go to Dashboard":
```ts
localStorage.setItem('finmate-onboarded', 'true');
onFinish(); // → navigate('/')
```

---

## RegisterPage change

```ts
// After register() succeeds:
localStorage.setItem('finmate-onboarded', 'false');
navigate('/onboarding');
```
