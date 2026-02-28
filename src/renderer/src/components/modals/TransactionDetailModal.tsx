import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingCart, Utensils, Zap, Car, Home, Dumbbell, Wifi, Music, ArrowDownLeft, Tv, Package, Heart } from 'lucide-react';
import { useFinance, Transaction } from '@/context/FinanceContext';

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

interface Props { transaction: Transaction | null; onClose: () => void; }

export default function TransactionDetailModal({ transaction: txn, onClose }: Props) {
  const { deleteTransaction } = useFinance();

  const handleDelete = () => {
    if (txn) { deleteTransaction(txn.id); onClose(); }
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
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Transaction Details</h2>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>

            {/* Icon + amount */}
            <div className="flex flex-col items-center py-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: txn.amount > 0 ? 'var(--accent-green)' : 'var(--text-primary)', fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>
                {txn.amount > 0 ? '+' : '-'}${Math.abs(txn.amount).toFixed(2)}
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

            <div className="flex gap-3 mt-6">
              <button onClick={handleDelete}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-500/20"
                style={{ border: '1px solid rgba(248,113,113,0.3)', color: 'var(--accent-red)' }}>
                <Trash2 size={13} /> Delete
              </button>
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                style={{ background: 'var(--bg-card-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
