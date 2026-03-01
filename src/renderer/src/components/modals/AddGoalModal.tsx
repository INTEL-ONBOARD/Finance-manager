import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

const ICON_OPTIONS = ['Umbrella', 'Plane', 'Laptop', 'Home', 'Car', 'GraduationCap', 'Heart', 'Star', 'ShoppingBag', 'Smartphone'];
const COLOR_OPTIONS = ['#4ade80', '#60a5fa', '#f59e0b', '#f87171', '#a78bfa', '#34d399', '#f97316', '#e879f9'];

interface Props { open: boolean; onClose: () => void; }

export default function AddGoalModal({ open, onClose }: Props) {
  const { addGoal, currency } = useFinance();
  const [form, setForm] = useState({
    name: '', target: '', current: '0',
    icon: 'Star', color: '#4ade80', deadline: '',
  });
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.target || isNaN(Number(form.target)) || Number(form.target) <= 0) { setError('Enter a valid target amount'); return; }
    if (!form.deadline.trim()) { setError('Deadline is required'); return; }
    addGoal({
      name: form.name.trim(),
      target: Number(form.target),
      current: Number(form.current) || 0,
      icon: form.icon,
      color: form.color,
      deadline: form.deadline.trim(),
    });
    setForm({ name: '', target: '', current: '0', icon: 'Star', color: '#4ade80', deadline: '' });
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
            style={{ background: '#1a2035', border: '1px solid var(--border-light)', boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>New Savings Goal</h2>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goal Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Emergency Fund"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target ({currency})</label>
                  <input value={form.target} onChange={e => set('target', e.target.value)} type="number" min="0" placeholder="5000"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Geist Mono, monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Already Saved ({currency})</label>
                  <input value={form.current} onChange={e => set('current', e.target.value)} type="number" min="0" placeholder="0"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Geist Mono, monospace' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Date (e.g. Dec 2026)</label>
                <input value={form.deadline} onChange={e => set('deadline', e.target.value)} placeholder="Dec 2026"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Geist Mono, monospace' }} />
              </div>

              {/* Color picker */}
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
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 flex items-center justify-center gap-2"
                style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
                <Plus size={14} /> Create Goal
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
