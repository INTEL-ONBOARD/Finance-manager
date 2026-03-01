# Accounts Management — Design Document
_Date: 2026-03-01_

## Problem / Context

The Accounts page currently shows a read-only view of account data. Users have no way to add, edit, or delete bank accounts through the UI. The backend IPC infrastructure (`db:accounts:getAll/add/update/delete`) already exists — only the UI layer is missing.

The goal is to turn AccountsPage into a fully functional account management hub where users can add debit, savings, credit, investment, and loan accounts linked to real Sri Lankan bank branches.

---

## Account Types

Five types supported: `checking`, `savings`, `credit`, `investment`, `loan`

---

## Data Model

Extend the existing `Account` interface in `src/renderer/src/context/FinanceContext.tsx`:

```typescript
export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan';
  balance: number;
  limit?: number;            // credit: credit limit; loan: original loan amount
  color: string;             // hex color
  bank?: string;             // e.g. "Commercial Bank of Ceylon"
  branch?: string;           // e.g. "Colombo Fort"
  accountNumber?: string;    // optional, stored but masked in UI
  cardNetwork?: 'visa' | 'mastercard' | 'amex';  // credit cards only
  linkedAccountId?: string;  // credit: optional link to a bank account
  interestRate?: number;     // savings/loan: annual % rate
  loanMaturityDate?: string; // loan: ISO date string
  monthlyPayment?: number;   // loan: monthly instalment
}
```

---

## Bank Data

No external API. Static dataset shipped at `src/renderer/src/utils/sriLankaBanks.ts`.

Structure:
```typescript
export interface BankBranch { name: string; city: string; }
export interface Bank { id: string; name: string; branches: BankBranch[]; }
export const SRI_LANKA_BANKS: Bank[] = [ ... ];
```

Banks to include (~17):
- Commercial Bank of Ceylon
- Bank of Ceylon
- Sampath Bank
- HNB (Hatton National Bank)
- Seylan Bank
- NSB (National Savings Bank)
- People's Bank
- DFCC Bank
- NTB (Nations Trust Bank)
- Union Bank
- Pan Asia Bank
- Amana Bank
- MCB Bank
- Standard Chartered
- HSBC
- Citi Bank
- Deutsche Bank

Each bank has 8–15 key branch locations (major cities: Colombo, Kandy, Galle, Jaffna, Matara, Kurunegala, Negombo, Badulla, etc.)

---

## UI: AccountsPage Changes (`src/renderer/src/pages/AccountsPage.tsx`)

1. **Header row**: `Total Assets` + `Total Debt` stat cards + `[+ Add Account]` button (top-right, primary accent)
2. **Account cards**: add `bank · branch` subtitle below account name; add `⋯` three-dot menu (Edit / Delete)
3. **Empty state**: centered illustration + "No accounts yet" text + large `+ Add Account` CTA
4. **Loan card**: progress bar showing amount repaid vs. original loan amount

---

## UI: AddAccountModal (`src/renderer/src/components/modals/AddAccountModal.tsx`)

### Layout
Split-pane modal (~760px wide):
- **Left sidebar (180px)**: 5 type tiles with icon + label. Active tile: accent left border + bg tint.
- **Right panel**: scrollable form, changes based on selected type.

### Shared fields (all types)
| Field | Input |
|-------|-------|
| Bank | Searchable dropdown → `SRI_LANKA_BANKS` |
| Branch | Dependent dropdown (filters by selected bank) |
| Account Name | Text (auto-suggest from bank+type) |
| Current Balance | Number (LKR prefix) |
| Color | 6 preset swatches |

### Type-specific fields
| Type | Extra Fields |
|------|-------------|
| Checking | Account Number (optional) |
| Savings | Account Number (optional), Interest Rate % |
| Credit Card | Credit Limit, Card Network (Visa/MC/Amex), Link to bank account (optional), Account Number (optional) |
| Investment | Current Value (replaces Balance label), Platform/Broker name |
| Loan | Original Loan Amount, Monthly Payment, Interest Rate %, Maturity Date |

### Validation
- Required: Bank, Account Name, Balance/Value
- Submit button disabled until required fields filled
- Balance for credit/loan = outstanding amount (shown as negative internally)

### Edit mode
Same modal, pre-filled. Title changes to "Edit Account". Calls `updateAccount`.

---

## UI: Delete Confirmation

Inline in account card `⋯` menu. After clicking Delete, card shows:
> "Delete this account? Linked transactions will remain."
> `[Cancel]` `[Delete]`

Uses `deleteAccount` from FinanceContext.

---

## FinanceContext Changes (`src/renderer/src/context/FinanceContext.tsx`)

1. Update `Account` interface (add new optional fields)
2. Update type union: add `'loan'` (keep `'investment'`)
3. Add 3 new context actions:

```typescript
addAccount: (account: Omit<Account, 'id'>) => Promise<void>
updateAccount: (id: string, updates: Partial<Account>) => Promise<void>
deleteAccount: (id: string) => Promise<void>
```

Each does optimistic state update → async IPC call.

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/renderer/src/utils/sriLankaBanks.ts` | **Create** — static bank/branch dataset |
| `src/renderer/src/components/modals/AddAccountModal.tsx` | **Create** — split-pane add/edit modal |
| `src/renderer/src/pages/AccountsPage.tsx` | **Modify** — add button, empty state, card menus, loan progress bar |
| `src/renderer/src/context/FinanceContext.tsx` | **Modify** — extend Account type, add 3 action methods |
| `src/renderer/src/types/electron.d.ts` | **Modify** — update Account type to match new interface |

---

## Verification

1. Run `npm run dev` — app opens without errors
2. Navigate to `/accounts`
3. Click `+ Add Account` → modal opens with 5 type tiles
4. Select "Checking" → bank dropdown shows Sri Lanka banks → select "Commercial Bank of Ceylon" → branch dropdown populates
5. Fill name + balance → click `Add Account` → modal closes → new card appears in grid
6. Click `⋯` on new card → Edit → modal pre-filled → change name → save → card updates
7. Click `⋯` → Delete → confirmation shown → confirm → card removed
8. Verify `Total Assets` / `Total Debt` stat cards update correctly after each operation
9. Restart app → accounts persist (MongoDB)
