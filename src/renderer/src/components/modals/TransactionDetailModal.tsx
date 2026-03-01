import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Edit2, Check, ShoppingCart, Utensils, Zap, Car, Home, Dumbbell, Wifi, Music, ArrowDownLeft, Tv, Package, Heart } from 'lucide-react';
import { useFinance, Transaction, TransactionCategory } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatCurrency';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = {
  Groceries: ShoppingCart, Dining: Utensils, Utilities: Zap, Transport: Car,
  Rent: Home, Gym: Dumbbell, Internet: Wifi, Spotify: Music, Netflix: Tv,
  Salary: ArrowDownLeft, Freelance: ArrowDownLeft, Investment: ArrowDownLeft,
  Shopping: Package, Health: Heart, Other: Package, Refund: ArrowDownLeft,
};
const colorMap: Record<string, string> = {
  Groceries: '#f59e0b', Dining: '#f97316', Utilities: '#60a5fa', Transport: '#a78bfa',
  Rent: '#f87171', Gym: '#34d399', Internet: '#60a5fa', Spotify: '#4ade80',
  Netflix: '#f87171', Salary: '#22c55e', Freelance: '#4ade80', Investment: '#a78bfa',
  Shopping: '#f59e0b', Health: '#34d399', Other: '#64748b', Refund: '#22c55e',
};

const CATEGORIES: TransactionCategory[] = [
  'Salary', 'Freelance', 'Investment', 'Refund',
  'Groceries', 'Dining', 'Transport', 'Utilities',
  'Rent', 'Gym', 'Internet', 'Spotify', 'Netflix',
  'Shopping', 'Health', 'Other',
];

const inputStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontSize: 13,
  borderRadius: 10,
  padding: '8px 12px',
  outline: 'none',
  width: '100%',
} as const;

interface Props { transaction: Transaction | null; onClose: () => void; }

export default function TransactionDetailModal({ transaction: txn, onClose }: Props) {
  const { deleteTransaction, updateTransaction, accounts, currency } = useFinance();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    absAmount: '',
    isExpense: true,
    category: 'Other' as TransactionCategory,
    account: '',
    date: '',
    note: '',
  });

  useEffect(() => {
    if (txn) {
      setForm({
        name: txn.name,
        absAmount: String(Math.abs(txn.amount)),
        isExpense: txn.amount < 0,
        category: txn.category,
        account: txn.account,
        date: txn.date,
        note: txn.note ?? '',
      });
      setEditing(false);
    }
  }, [txn]);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleDelete = () => {
    if (txn) { deleteTransaction(txn.id); onClose(); }
  };

  const handleSave = () => {
    if (!txn) return;
    const amount = parseFloat(form.absAmount);
    if (isNaN(amount) || amount <= 0) return;
    updateTransaction(txn.id, {
      name: form.name.trim() || txn.name,
      amount: form.isExpense ? -amount : amount,
      category: form.category,
      account: form.account,
      date: form.date,
      note: form.note || undefined,
    });
    setEditing(false);
  };

  const Icon = txn ? (iconMap[txn.category] || Package) : Package;
  const color = txn ? (colorMap[txn.category] || '#64748b') : '#64748b';

  return (
    <AnimatePresence>
      {txn && (
        <div style={{ display: 'contents' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm rounded-2xl p-6"
            style={{ transform: 'translate(-50%,-50%)', background: '#1a2035', border: '1px solid var(--border-light)', boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {editing ? 'Edit Transaction' : 'Transaction Details'}
              </h2>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>

            {editing ? (
              <div className="flex flex-col gap-3">
                {/* Type toggle */}
                <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  {(['expense', 'income'] as const).map(t => (
                    <button key={t} onClick={() => set('isExpense', t === 'expense')}
                      className="flex-1 py-2 text-sm font-semibold transition-colors capitalize"
                      style={{
                        background: (t === 'expense') === form.isExpense ? (t === 'expense' ? 'rgba(248,113,113,0.15)' : 'rgba(34,197,94,0.15)') : 'transparent',
                        color: (t === 'expense') === form.isExpense ? (t === 'expense' ? 'var(--accent-red)' : 'var(--accent-green)') : 'var(--text-muted)',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</label>
                  <input value={form.absAmount} onChange={e => set('absAmount', e.target.value)} type="number" min="0" step="0.01"
                    style={{ ...inputStyle, marginTop: 4, fontFamily: 'Geist Mono, monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} style={{ ...inputStyle, marginTop: 4 }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account</label>
                  <select value={form.account} onChange={e => set('account', e.target.value)} style={{ ...inputStyle, marginTop: 4 }}>
                    {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
                  <input value={form.date} onChange={e => set('date', e.target.value)} type="date"
                    style={{ ...inputStyle, marginTop: 4, fontFamily: 'Geist Mono, monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note (optional)</label>
                  <input value={form.note} onChange={e => set('note', e.target.value)} placeholder="Add a note…"
                    style={{ ...inputStyle, marginTop: 4 }} />
                </div>
              </div>
            ) : (
              <>
                {/* Icon + amount */}
                <div className="flex flex-col items-center py-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: txn.amount > 0 ? 'var(--accent-green)' : 'var(--text-primary)', fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>
                    {txn.amount > 0 ? '+' : '-'}{formatCurrency(Math.abs(txn.amount), currency)}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{txn.name}</div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Category', value: txn.category },
                    { label: 'Account', value: txn.account },
                    { label: 'Date', value: new Date(txn.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                    ...(txn.note ? [{ label: 'Note', value: txn.note }] : []),
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    Cancel
                  </button>
                  <button onClick={handleSave}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 flex items-center justify-center gap-2"
                    style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
                    <Check size={13} /> Save
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleDelete}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-500/20"
                    style={{ border: '1px solid rgba(248,113,113,0.3)', color: 'var(--accent-red)' }}>
                    <Trash2 size={13} /> Delete
                  </button>
                  <button onClick={() => setEditing(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
                    style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                    style={{ background: 'var(--bg-card-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
                    Close
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
