# Onboarding Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 4-step post-registration onboarding wizard at `/onboarding` — Welcome → Add Account → Add Transactions → App Tour — that new users see exactly once before landing on the dashboard.

**Architecture:** `OnboardingPage` at a new `/onboarding` route manages `step` state (1–4). Each step is a separate component in `src/renderer/src/components/onboarding/`. A `localStorage` key `finmate-onboarded` controls routing: set to `'false'` by `RegisterPage` after registration, checked by `OnboardingPage` on mount (redirects to `/` if not `'false'`), set to `'true'` when the user clicks "Go to Dashboard" in step 4. Steps 2 and 3 are skippable; steps 1 and 4 are not. Uses `FinanceContext` `addAccount`/`addTransactions` for data persistence (not raw IPC). Framer Motion `AnimatePresence` handles step transition animations.

**Tech Stack:** React 19, react-router-dom v7 (HashRouter), Framer Motion, Tailwind CSS v4, Lucide React, FinanceContext, AuthContext

---

## Task 1: Wire up the route and `localStorage` flag

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/pages/RegisterPage.tsx`
- Create: `src/renderer/src/pages/OnboardingPage.tsx` (scaffold only)

**Step 1: Create the `OnboardingPage` scaffold**

Create `src/renderer/src/pages/OnboardingPage.tsx`:
```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OnboardingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('finmate-onboarded') !== 'false') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return <div style={{ color: 'var(--text-primary)', padding: 40 }}>Onboarding — coming soon</div>;
}
```

**Step 2: Add the route to `App.tsx`**

In `src/renderer/src/App.tsx`, add the import after the other page imports:
```tsx
import OnboardingPage from './pages/OnboardingPage'
```

Add this route entry inside `createHashRouter([...])`, after the `/register` entry:
```tsx
{ path: '/onboarding', element: <PrivateRoute><OnboardingPage /></PrivateRoute> },
```

**Step 3: Update `RegisterPage` to set the flag and redirect to `/onboarding`**

In `src/renderer/src/pages/RegisterPage.tsx`, change `handleSubmit`:
```tsx
// Before:
await register(name, email, password, selectedAvatar);
navigate('/');

// After:
await register(name, email, password, selectedAvatar);
localStorage.setItem('finmate-onboarded', 'false');
navigate('/onboarding');
```

**Step 4: Verify manually**
- Run `npm run dev`
- Register a new user → should land on `/onboarding` showing "Onboarding — coming soon"
- Log out, log back in → should go straight to `/` (flag is not `'false'`)
- Manually set `localStorage.finmate-onboarded = 'false'` in devtools, refresh → stays on `/onboarding`

**Step 5: Commit**
```bash
git add src/renderer/src/App.tsx src/renderer/src/pages/RegisterPage.tsx src/renderer/src/pages/OnboardingPage.tsx
git commit -m "feat: add /onboarding route scaffold and localStorage flag"
```

---

## Task 2: `StepWelcome` component

**Files:**
- Create: `src/renderer/src/components/onboarding/StepWelcome.tsx`

**Step 1: Create the component**

Create `src/renderer/src/components/onboarding/StepWelcome.tsx`:
```tsx
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface StepWelcomeProps {
  name: string;
  avatar?: string;
  onNext: () => void;
}

export default function StepWelcome({ name, avatar, onNext }: StepWelcomeProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-brand)' }}
          />
        ) : (
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'var(--accent-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, fontWeight: 800, color: 'white',
          }}>
            {initial}
          </div>
        )}
      </motion.div>

      {/* Heading */}
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Welcome, {name}!
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 360 }}>
          Let's get your finances set up. We'll add your accounts, log some transactions, and show you around.
        </p>
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNext}
        className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold mt-2 transition-all"
        style={{
          background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))',
          color: 'white',
          fontSize: 15,
          boxShadow: '0 4px 14px rgba(132,204,22,0.25)',
        }}
      >
        Let's get started
        <ArrowRight size={18} />
      </motion.button>
    </div>
  );
}
```

**Step 2: Verify**
No automated test for this visual component. Wire it into `OnboardingPage` (Task 4) and verify by eye.

**Step 3: Commit**
```bash
git add src/renderer/src/components/onboarding/StepWelcome.tsx
git commit -m "feat: add StepWelcome onboarding component"
```

---

## Task 3: `StepAddAccount` component

**Files:**
- Create: `src/renderer/src/components/onboarding/StepAddAccount.tsx`

**Step 1: Create the component**

Create `src/renderer/src/components/onboarding/StepAddAccount.tsx`:
```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, SkipForward } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import type { Account } from '@/context/FinanceContext';

const ACCOUNT_COLORS = ['#84cc16', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#14b8a6'];
const ACCOUNT_TYPES: { value: Account['type']; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' },
  { value: 'loan', label: 'Loan' },
];

interface StepAddAccountProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function StepAddAccount({ onNext, onSkip, onBack }: StepAddAccountProps) {
  const { addAccount, currency } = useFinance();
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<Account['type']>('checking');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;
    setError('');
    setSaving(true);
    try {
      const color = ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)];
      addAccount({ name: accountName.trim(), type: accountType, balance: parseFloat(balance) || 0, color });
      onNext();
    } catch {
      setError('Failed to save account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Add your first account
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Connect a bank account or wallet to start tracking your balance.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Account name */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', paddingLeft: 2 }}>Account name</label>
          <input
            style={inputStyle}
            value={accountName}
            onChange={e => setAccountName(e.target.value)}
            placeholder="e.g. Main Checking"
            required
          />
        </div>

        {/* Account type */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', paddingLeft: 2 }}>Account type</label>
          <select
            style={inputStyle}
            value={accountType}
            onChange={e => setAccountType(e.target.value as Account['type'])}
          >
            {ACCOUNT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Opening balance */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', paddingLeft: 2 }}>
            Opening balance ({currency})
          </label>
          <input
            style={inputStyle}
            type="number"
            value={balance}
            onChange={e => setBalance(e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>

        {error && <p style={{ fontSize: 13, color: 'var(--accent-red)' }}>{error}</p>}

        {/* Buttons */}
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <button type="button" onClick={onSkip}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            <SkipForward size={15} /> Skip for now
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-all"
            style={{
              background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))',
              color: 'white', fontSize: 13,
              opacity: saving ? 0.7 : 1,
            }}>
            {saving ? 'Saving…' : <>Continue <ArrowRight size={15} /></>}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/renderer/src/components/onboarding/StepAddAccount.tsx
git commit -m "feat: add StepAddAccount onboarding component"
```

---

## Task 4: `StepAddTransactions` component

**Files:**
- Create: `src/renderer/src/components/onboarding/StepAddTransactions.tsx`

**Step 1: Create the component**

Create `src/renderer/src/components/onboarding/StepAddTransactions.tsx`:
```tsx
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, SkipForward, Plus, Upload } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import type { TransactionCategory } from '@/context/FinanceContext';

const CATEGORIES: TransactionCategory[] = [
  'Salary','Freelance','Investment','Refund',
  'Groceries','Dining','Transport','Utilities',
  'Rent','Gym','Internet','Spotify','Netflix',
  'Shopping','Health','Other',
];

interface TxRow {
  name: string;
  amount: string;
  isExpense: boolean;
  category: TransactionCategory;
  date: string;
}

function emptyRow(): TxRow {
  return {
    name: '',
    amount: '',
    isExpense: true,
    category: 'Other',
    date: new Date().toISOString().slice(0, 10),
  };
}

interface StepAddTransactionsProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function StepAddTransactions({ onNext, onSkip, onBack }: StepAddTransactionsProps) {
  const { addTransactions } = useFinance();
  const [tab, setTab] = useState<'manual' | 'csv'>('manual');
  const [rows, setRows] = useState<TxRow[]>([emptyRow()]);
  const [csvPreview, setCsvPreview] = useState<TxRow[] | null>(null);
  const [csvError, setCsvError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const inputStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 13,
    outline: 'none',
    width: '100%',
  };

  const updateRow = (i: number, field: keyof TxRow, value: string | boolean) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const parseCsv = (text: string) => {
    setCsvError('');
    const lines = text.trim().split('\n');
    const header = lines[0].toLowerCase().replace(/\s/g, '');
    if (!header.includes('name') || !header.includes('amount')) {
      setCsvError('CSV must have at least "name" and "amount" columns.');
      return;
    }
    const cols = lines[0].split(',').map(c => c.trim().toLowerCase());
    const nameIdx = cols.indexOf('name');
    const amtIdx = cols.indexOf('amount');
    const catIdx = cols.indexOf('category');
    const dateIdx = cols.indexOf('date');
    const parsed: TxRow[] = [];
    for (let i = 1; i < lines.length && i <= 10; i++) {
      const parts = lines[i].split(',').map(c => c.trim());
      if (parts.length < 2) continue;
      const amt = parseFloat(parts[amtIdx] || '0');
      parsed.push({
        name: parts[nameIdx] || 'Transaction',
        amount: Math.abs(amt).toString(),
        isExpense: amt < 0,
        category: (parts[catIdx] as TransactionCategory) || 'Other',
        date: parts[dateIdx] || new Date().toISOString().slice(0, 10),
      });
    }
    if (parsed.length === 0) { setCsvError('No valid rows found in CSV.'); return; }
    setCsvPreview(parsed);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => parseCsv(e.target?.result as string);
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSave = async (txRows: TxRow[]) => {
    setSaving(true);
    setError('');
    try {
      const toAdd = txRows
        .filter(r => r.name.trim() && r.amount)
        .map(r => ({
          name: r.name.trim(),
          amount: r.isExpense ? -Math.abs(parseFloat(r.amount)) : Math.abs(parseFloat(r.amount)),
          category: r.category,
          date: r.date,
          account: 'Default',
        }));
      if (toAdd.length > 0) addTransactions(toAdd);
      onNext();
    } catch {
      setError('Failed to save transactions.');
    } finally {
      setSaving(false);
    }
  };

  const tabStyle = (active: boolean) => ({
    fontSize: 13, fontWeight: 600,
    padding: '6px 16px', borderRadius: 8,
    cursor: 'pointer',
    background: active ? 'var(--accent-brand)' : 'transparent',
    color: active ? 'white' : 'var(--text-secondary)',
    border: 'none',
    transition: 'all 0.15s',
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Log your first transactions
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Add a few recent transactions to get your dashboard going.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', width: 'fit-content' }}>
        <button style={tabStyle(tab === 'manual')} onClick={() => setTab('manual')}>Enter manually</button>
        <button style={tabStyle(tab === 'csv')} onClick={() => setTab('csv')}>Upload CSV</button>
      </div>

      {/* Manual tab */}
      {tab === 'manual' && (
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-end p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              {/* +/- toggle */}
              <button type="button"
                onClick={() => updateRow(i, 'isExpense', !row.isExpense)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: row.isExpense ? 'rgba(248,113,113,0.15)' : 'rgba(34,197,94,0.15)',
                  color: row.isExpense ? '#f87171' : '#22c55e',
                  fontSize: 18, fontWeight: 700, lineHeight: 1,
                }}>
                {row.isExpense ? '−' : '+'}
              </button>
              {/* Name */}
              <input style={{ ...inputStyle, flex: 2 }} placeholder="Description" value={row.name}
                onChange={e => updateRow(i, 'name', e.target.value)} />
              {/* Amount */}
              <input style={{ ...inputStyle, width: 90 }} type="number" placeholder="0.00"
                value={row.amount} min="0" step="0.01"
                onChange={e => updateRow(i, 'amount', e.target.value)} />
              {/* Category */}
              <select style={{ ...inputStyle, flex: 1 }} value={row.category}
                onChange={e => updateRow(i, 'category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {/* Date */}
              <input style={{ ...inputStyle, width: 130 }} type="date" value={row.date}
                onChange={e => updateRow(i, 'date', e.target.value)} />
            </div>
          ))}
          {rows.length < 3 && (
            <button type="button"
              onClick={() => setRows(prev => [...prev, emptyRow()])}
              className="flex items-center gap-1 self-start transition-all hover:opacity-80"
              style={{ fontSize: 13, color: 'var(--accent-brand)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Plus size={14} /> Add another
            </button>
          )}
        </div>
      )}

      {/* CSV tab */}
      {tab === 'csv' && (
        <div className="flex flex-col gap-3">
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Expected columns: <code style={{ color: 'var(--accent-brand)' }}>name, amount, category, date</code>
            <br />Example: <code style={{ color: 'var(--text-secondary)' }}>Groceries,-45.50,Groceries,2026-02-28</code>
          </p>

          {!csvPreview ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all hover:bg-black/5"
              style={{ border: '2px dashed var(--border)', padding: '32px 20px', borderRadius: 16 }}>
              <Upload size={28} style={{ color: 'var(--text-muted)' }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                Drag & drop a CSV file here, or <span style={{ color: 'var(--accent-brand)', fontWeight: 600 }}>click to browse</span>
              </p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Preview — {csvPreview.length} row(s)</p>
              <div style={{ maxHeight: 180, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      {['Name','Amount','Category','Date'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((r, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>{r.name}</td>
                        <td style={{ padding: '6px 10px', color: r.isExpense ? '#f87171' : '#22c55e', fontFamily: 'Geist Mono, monospace' }}>
                          {r.isExpense ? '-' : '+'}{r.amount}
                        </td>
                        <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.category}</td>
                        <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => setCsvPreview(null)}
                style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start', padding: 0 }}>
                ← Choose different file
              </button>
            </div>
          )}
          {csvError && <p style={{ fontSize: 13, color: '#f87171' }}>{csvError}</p>}
        </div>
      )}

      {error && <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>}

      {/* Navigation buttons */}
      <div className="flex gap-2 mt-1">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5"
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={15} /> Back
        </button>
        <button type="button" onClick={onSkip}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5"
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          <SkipForward size={15} /> Skip for now
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          type="button"
          disabled={saving}
          onClick={() => handleSave(tab === 'csv' && csvPreview ? csvPreview : rows)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold"
          style={{
            background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))',
            color: 'white', fontSize: 13,
            opacity: saving ? 0.7 : 1,
          }}>
          {saving ? 'Saving…' : <>Continue <ArrowRight size={15} /></>}
        </motion.button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/renderer/src/components/onboarding/StepAddTransactions.tsx
git commit -m "feat: add StepAddTransactions onboarding component"
```

---

## Task 5: `StepTour` component (welcome slideshow)

**Files:**
- Create: `src/renderer/src/components/onboarding/StepTour.tsx`

**Step 1: Create the component**

Create `src/renderer/src/components/onboarding/StepTour.tsx`:
```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, LayoutDashboard, ArrowLeftRight, PiggyBank, Target, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    icon: LayoutDashboard,
    color: '#84cc16',
    title: 'Your Dashboard',
    body: "Get a bird's-eye view of your finances — income, expenses, net worth, and savings at a glance.",
  },
  {
    icon: ArrowLeftRight,
    color: '#3b82f6',
    title: 'Transactions',
    body: 'Log every income and expense. Filter, search, and see where your money actually goes.',
  },
  {
    icon: PiggyBank,
    color: '#f59e0b',
    title: 'Budget & Bills',
    body: "Set spending limits per category and track recurring bills so nothing slips through the cracks.",
  },
  {
    icon: Target,
    color: '#a855f7',
    title: 'Savings Goals',
    body: 'Define goals with deadlines. Watch your progress bars fill as you contribute over time.',
  },
  {
    icon: Sparkles,
    color: '#14b8a6',
    title: 'AI Assistant',
    body: 'Ask your AI chat anything — spending breakdowns, saving advice, or financial Q&A.',
  },
];

interface StepTourProps {
  onFinish: () => void;
}

export default function StepTour({ onFinish }: StepTourProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const slide = SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;

  const go = (dir: number) => {
    setDirection(dir);
    setIndex(i => i + dir);
  };

  const finish = () => {
    localStorage.setItem('finmate-onboarded', 'true');
    onFinish();
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4, textAlign: 'center' }}>
          Here's what you can do
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
          A quick tour of the key features.
        </p>
      </div>

      {/* Slide card */}
      <div style={{ width: '100%', maxWidth: 400, minHeight: 220, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-col items-center text-center gap-5 p-8 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: `${slide.color}20`,
              border: `1.5px solid ${slide.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={28} style={{ color: slide.color }} />
            </div>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                {slide.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {slide.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
            style={{
              width: i === index ? 20 : 8,
              height: 8, borderRadius: 4,
              background: i === index ? 'var(--accent-brand)' : 'var(--border)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 w-full" style={{ maxWidth: 400 }}>
        {index > 0 && (
          <button
            onClick={() => go(-1)}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <ArrowLeft size={15} /> Prev
          </button>
        )}
        {!isLast ? (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => go(1)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold"
            style={{
              background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))',
              color: 'white', fontSize: 13,
            }}>
            Next <ArrowRight size={15} />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={finish}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold"
            style={{
              background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))',
              color: 'white', fontSize: 13,
              boxShadow: '0 4px 14px rgba(132,204,22,0.3)',
            }}>
            Go to Dashboard <ArrowRight size={15} />
          </motion.button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**
```bash
git add src/renderer/src/components/onboarding/StepTour.tsx
git commit -m "feat: add StepTour welcome slideshow component"
```

---

## Task 6: Build the `OnboardingPage` — full wizard controller

**Files:**
- Modify: `src/renderer/src/pages/OnboardingPage.tsx` (replace scaffold)

**Step 1: Replace the scaffold with the full implementation**

Replace the entire contents of `src/renderer/src/pages/OnboardingPage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import StepWelcome from '@/components/onboarding/StepWelcome';
import StepAddAccount from '@/components/onboarding/StepAddAccount';
import StepAddTransactions from '@/components/onboarding/StepAddTransactions';
import StepTour from '@/components/onboarding/StepTour';

const STEP_LABELS = ['Welcome', 'Add Account', 'Transactions', 'App Tour'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (localStorage.getItem('finmate-onboarded') !== 'false') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const next = () => goTo(step + 1);
  const back = () => goTo(step - 1);
  const finish = () => navigate('/');

  return (
    <div className="flex min-h-screen w-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Left panel — same style as RegisterPage */}
      <div
        className="hidden lg:flex w-2/5 relative overflow-hidden items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #1a2a0a 0%, #1e3a10 40%, #0f2208 100%)',
          borderRight: '1px solid rgba(0,0,0,0.15)',
        }}
      >
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #84cc16 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(132,204,22,0.18) 0%, transparent 70%)',
        }} />
        <div className="relative z-10 flex flex-col items-center text-center p-12 gap-6">
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: '#84cc16',
            boxShadow: '0 8px 32px rgba(132,204,22,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Hexagon size={40} className="text-white fill-white" />
          </div>
          <div>
            <h1 style={{ color: '#f1f5f9', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>
              Setting up <br /><span style={{ color: '#84cc16' }}>your profile</span>
            </h1>
            <p style={{ color: 'rgba(241,245,249,0.55)', fontSize: 15, lineHeight: 1.6 }}>
              Just a few steps to get your financial dashboard ready.
            </p>
          </div>
          {/* Step list */}
          <div className="flex flex-col gap-2 w-full mt-4">
            {STEP_LABELS.map((label, i) => {
              const s = i + 1;
              const done = step > s;
              const active = step === s;
              return (
                <div key={s} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ background: active ? 'rgba(132,204,22,0.12)' : 'transparent', border: active ? '1px solid rgba(132,204,22,0.2)' : '1px solid transparent' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: done ? '#84cc16' : active ? 'rgba(132,204,22,0.3)' : 'rgba(255,255,255,0.1)',
                    border: done || active ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: done || active ? 'white' : 'rgba(255,255,255,0.4)',
                    flexShrink: 0,
                  }}>
                    {done ? '✓' : s}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#84cc16' : done ? 'rgba(241,245,249,0.7)' : 'rgba(241,245,249,0.35)' }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative overflow-hidden">
        {/* Progress dots (mobile + desktop) */}
        {step > 1 && step < 4 && (
          <div className="flex items-center gap-2 mb-8 self-start">
            {[1,2,3,4].map(s => (
              <div key={s} style={{
                width: step >= s ? 20 : 8, height: 8, borderRadius: 4,
                background: step >= s ? 'var(--accent-brand)' : 'var(--border)',
                transition: 'all 0.2s',
              }} />
            ))}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
              Step {step} of 4 — {STEP_LABELS[step - 1]}
            </span>
          </div>
        )}

        {/* Step content with slide animation */}
        <div className="w-full max-w-lg overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? 30 : -30, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d > 0 ? -30 : 30, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 1 && (
                <StepWelcome
                  name={user?.name ?? 'there'}
                  avatar={user?.avatar}
                  onNext={next}
                />
              )}
              {step === 2 && (
                <StepAddAccount onNext={next} onSkip={next} onBack={back} />
              )}
              {step === 3 && (
                <StepAddTransactions onNext={next} onSkip={next} onBack={back} />
              )}
              {step === 4 && (
                <StepTour onFinish={finish} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify manually**
- Register → lands on `/onboarding`, step 1 shows avatar + name
- Click "Let's get started" → step 2 with progress dots and "Step 2 of 4"
- Fill in account form, click Continue → step 3
- Click Skip on step 3 → step 4 (tour slideshow)
- Click through all 5 slides, click "Go to Dashboard" → `/`, `localStorage.finmate-onboarded = 'true'`
- Log out, log back in → goes straight to `/`, NOT `/onboarding`
- Left panel shows step list with completed checkmarks

**Step 3: Commit**
```bash
git add src/renderer/src/pages/OnboardingPage.tsx
git commit -m "feat: complete OnboardingPage wizard controller with all 4 steps"
```

---

## Task 7: Final check — alias imports

**Note:** The onboarding components use `@/components/onboarding/...` and `@/context/...` path aliases. These are already configured in `electron.vite.config.ts` (`@ → src/renderer/src`). No config change needed.

**Verify `tsconfig.web.json` has the alias:**
The alias `@/*` → `./src/*` (relative to `src/renderer/`) should already exist. Check it:
```bash
grep -r '"@"' /Users/kkwenuja/development/Personal\ Projects/Finance-manager/electron.vite.config.ts
```
Expected output: something like `'@': resolve('src/renderer/src')` — if present, no change needed.

**Step 2: Commit**
```bash
git add -A
git commit -m "feat: onboarding flow complete"
```
```

---

Plan complete and saved to `docs/plans/2026-03-01-onboarding-flow-plan.md`.
