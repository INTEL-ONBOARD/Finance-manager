# Design: Comprehensive Sri Lanka Banks & Branches Data

**Date:** 2026-03-01
**File:** `src/renderer/src/utils/sriLankaBanks.ts`

## Scope

Replace the placeholder branch data (6–10 branches per bank) with comprehensive real branch data for all licensed banks operating in Sri Lanka.

## Banks Included

### Local Licensed Commercial Banks
- Bank of Ceylon (state-owned, largest network ~600+ branches)
- People's Bank (state-owned, ~700+ branches)
- Commercial Bank of Ceylon (~270 branches)
- Hatton National Bank (~250 branches)
- Sampath Bank (~230 branches)
- Seylan Bank (~170 branches)
- Nations Trust Bank (~95 branches)
- DFCC Bank (~137 branches)
- Pan Asia Bank (~90 branches)
- National Development Bank (~111 branches)
- Union Bank of Colombo (~70 branches)
- Amana Bank (~30 branches)
- Cargills Bank (~20 branches)
- Sanasa Development Bank (~35 branches)

### State Specialised Banks
- National Savings Bank (~250 branches)
- Regional Development Bank / Lankaputhra (~65 branches)

### Foreign Banks
- Standard Chartered (~4 branches)
- HSBC (~4 branches)
- Citibank (1 branch)
- Deutsche Bank (1 branch)
- Habib Bank (~5 branches)
- MCB Bank (~3 branches)
- Indian Bank (~4 branches)
- Indian Overseas Bank (~4 branches)
- Bank of India (~3 branches)
- Bank of Baroda (~3 branches)
- State Bank of India (~3 branches)

## Data Structure

No schema changes — existing `Bank` / `BankBranch` interfaces are kept:

```ts
interface BankBranch { name: string; city: string; }
interface Bank { id: string; name: string; branches: BankBranch[]; }
```

## What Changes

Only `src/renderer/src/utils/sriLankaBanks.ts` is modified. All modal/component code remains untouched.
