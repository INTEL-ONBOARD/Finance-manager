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
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <button type="button" onClick={onSkip}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>
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
              border: 'none', cursor: 'pointer',
            }}>
            {saving ? 'Saving…' : <><span>Continue</span><ArrowRight size={15} /></>}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
