import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import type { Bill } from '@/context/FinanceContext';

const CATEGORIES = ['Housing', 'Utilities', 'Subscriptions', 'Insurance', 'Food', 'Transport', 'Health', 'Entertainment', 'Other'];
const COLOR_OPTIONS = ['#4ade80', '#60a5fa', '#f59e0b', '#f87171', '#a78bfa', '#34d399', '#f97316', '#e879f9'];

interface Props { open: boolean; onClose: () => void; bill?: Bill; }

export default function AddBillModal({ open, onClose, bill }: Props) {
  const { addBill, updateBill, currency } = useFinance();
  const [form, setForm] = useState({ name: '', amount: '', dueDay: '', category: 'Utilities', color: '#60a5fa' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (bill) {
        setForm({ name: bill.name, amount: String(bill.amount), dueDay: String(bill.dueDay), category: bill.category, color: bill.color });
      } else {
        setForm({ name: '', amount: '', dueDay: '', category: 'Utilities', color: '#60a5fa' });
      }
      setError('');
    }
  }, [open, bill]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) { setError('Enter a valid amount'); return; }
    const day = parseInt(form.dueDay, 10);
    if (!form.dueDay || isNaN(day) || day < 1 || day > 31) { setError('Enter a valid due day (1–31)'); return; }

    if (bill) {
      updateBill(bill.id, { name: form.name.trim(), amount: Number(form.amount), dueDay: day, category: form.category, color: form.color });
    } else {
      addBill({ name: form.name.trim(), amount: Number(form.amount), dueDay: day, category: form.category, color: form.color, paid: false });
    }
    setError('');
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, x: '-50%', y: 'calc(-50% + 20px)' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.97, x: '-50%', y: 'calc(-50% + 16px)' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--bg-modal)', border: '1px solid var(--border-light)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{bill ? 'Edit Bill' : 'Add Bill'}</h2>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bill Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Netflix"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount ({currency})</label>
                  <input value={form.amount} onChange={e => set('amount', e.target.value)} type="number" min="0" placeholder="29.99"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Geist Mono, monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Day (1–31)</label>
                  <input value={form.dueDay} onChange={e => set('dueDay', e.target.value)} type="number" min="1" max="31" placeholder="15"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Geist Mono, monospace' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Colour</label>
                <div className="flex gap-2 mt-2">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => set('color', c)}
                      className="w-6 h-6 rounded-full transition-transform"
                      style={{ background: c, transform: form.color === c ? 'scale(1.25)' : 'scale(1)', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
            </div>

            {error && <p style={{ fontSize: 12, color: 'var(--accent-red)', marginTop: 8 }}>{error}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 flex items-center justify-center gap-2"
                style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
                {bill ? <><Check size={14} /> Save Changes</> : <><Plus size={14} /> Add Bill</>}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
