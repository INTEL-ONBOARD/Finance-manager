import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { useFinance, TransactionCategory } from '@/context/FinanceContext';

const CATEGORIES: TransactionCategory[] = [
  'Salary', 'Freelance', 'Investment', 'Refund',
  'Groceries', 'Dining', 'Transport', 'Utilities',
  'Rent', 'Gym', 'Internet', 'Spotify', 'Netflix',
  'Shopping', 'Health', 'Other',
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ open, onClose }: Props) {
  const { addTransaction, accounts } = useFinance();
  const [form, setForm] = useState({
    name: '', amount: '', category: 'Other' as TransactionCategory,
    account: 'Checking', date: new Date().toISOString().slice(0, 10),
    type: 'expense' as 'income' | 'expense', note: '',
  });
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Enter a valid amount'); return;
    }
    const amt = Number(form.amount);
    addTransaction({
      name: form.name.trim(),
      amount: form.type === 'expense' ? -amt : amt,
      category: form.category,
      account: form.account,
      date: form.date,
      note: form.note.trim() || undefined,
    });
    setForm({ name: '', amount: '', category: 'Other', account: 'Checking', date: new Date().toISOString().slice(0, 10), type: 'expense', note: '' });
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div style={{ display: 'contents' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl p-6"
            style={{ background: '#1a2035', border: '1px solid var(--border-light)', boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Add Transaction</h2>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {(['expense', 'income'] as const).map(t => (
                <button key={t} onClick={() => set('type', t)}
                  className="flex-1 py-2 text-sm font-semibold capitalize transition-all duration-200 rounded-xl"
                  style={{
                    background: form.type === t ? (t === 'expense' ? 'rgba(248,113,113,0.15)' : 'rgba(34,197,94,0.15)') : 'transparent',
                    color: form.type === t ? (t === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)') : 'var(--text-muted)',
                    margin: 3,
                  }}>{t}</button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {/* Name */}
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Whole Foods Market"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none transition-colors"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>

              {/* Amount + Category row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount ($)</label>
                  <input value={form.amount} onChange={e => set('amount', e.target.value)} type="number" min="0" step="0.01"
                    placeholder="0.00"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Geist Mono, monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Date + Account row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
                  <input value={form.date} onChange={e => set('date', e.target.value)} type="date"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Geist Mono, monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account</label>
                  <select value={form.account} onChange={e => set('account', e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }}>
                    {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note (optional)</label>
                <input value={form.note} onChange={e => set('note', e.target.value)}
                  placeholder="Add a note..."
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>
            </div>

            {error && <p style={{ fontSize: 12, color: 'var(--accent-red)', marginTop: 8 }}>{error}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 flex items-center justify-center gap-2"
                style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
                <Plus size={14} /> Add Transaction
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
