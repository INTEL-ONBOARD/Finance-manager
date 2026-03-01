# Account Card Redesign — Design Document
_Date: 2026-03-01_

## Problem / Context

The current account cards are flat info panels — icon, name, balance, progress bar, recent transactions. The user wants a premium physical credit-card style rendering for ALL account types (checking, savings, credit, investment, loan), inspired by banking apps that show realistic card visuals.

## Outcome

Each account tile has two zones:
1. **Card visual** (top) — physical card with gradient background, chip SVG, type icon, balance, masked account number, cardholder name, valid thru
2. **Info section** (bottom) — recent transactions + type-specific progress bars (credit utilization / loan repayment)

---

## Card Visual Design

### Dimensions & Shape
- Full tile width, aspect-ratio approx 1.586:1 (standard card)
- `border-radius: 16px`
- Framer Motion entry animation: scale + fade

### Background Gradient
- Uses `acct.color` (user-picked hex)
- `background: linear-gradient(135deg, ${darken(acct.color, 0.3)} 0%, ${acct.color} 50%, ${lighten(acct.color, 0.15)} 100%)`
- Implemented via inline style — no external color library needed; darken/lighten done with a simple hex manipulation helper
- Text is always white on the card

### Layout (flexbox column, full card height)

**Top row** (space-between):
- Left: EMV chip SVG (gold tinted, ~32×24px)
- Right: Lucide type icon (white, size 22)

**Middle** (flex-grow):
- Balance: large monospace, white (e.g. `LKR 450,000`)
- Label: `"Current Balance"` / `"Outstanding"` for credit/loan / `"Portfolio Value"` for investment — small, white/70

**Bottom row**:
- Left column: `ACCOUNT HOLDER` label + user name below; `VALID THRU` label + `••/••` or card expiry below
- Right: masked number (`**** **** **** 4321` or `**** **** **** ••••`) + card network text (Visa/Mastercard/Amex) for credit accounts

### ⋯ Menu Button
Absolute-positioned in top-right corner of the overall tile (not the card). White icon on semi-transparent dark pill bg. Z-index above card.

---

## Info Section (below card)

Separator `1px solid rgba(255,255,255,0.1)` or `var(--border)` depending on theme.

Padding: `12px 16px`

**Content (all types):**
- Recent transactions (up to 3): name (truncated) + amount (green/red)

**Credit accounts additionally:**
- Credit utilization bar with % and limit

**Loan accounts additionally:**
- Loan repayment progress bar with % repaid and original amount

---

## Color Helper

Small inline function (no external dep):
```typescript
function adjustColor(hex: string, amount: number): string {
  // Parse hex, clamp r/g/b by amount (negative = darken, positive = lighten)
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/renderer/src/pages/AccountsPage.tsx` | Replace card rendering block with new physical card visual + info section below |

No new files needed. No data model changes.

---

## Verification

1. `npm run dev` — app opens, no errors
2. Navigate to `/accounts`
3. Existing accounts render as physical cards with gradient backgrounds matching their color
4. Card shows: chip SVG, type icon, balance, masked number, cardholder name, account type label
5. Below card: recent transactions visible, credit card shows utilization bar, loan shows repayment bar
6. `⋯` menu still works for edit/delete
7. Add new account → card appears with correct gradient
8. Light mode: cards still readable (gradients always have white text regardless of theme)
