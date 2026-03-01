import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Umbrella, Plane, Laptop, Home, Car, GraduationCap, Heart, Star, ShoppingBag, Smartphone } from 'lucide-react';
import AppShell from '@/components/AppShell';
const AddGoalModal = lazy(() => import('@/components/modals/AddGoalModal'));
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatCurrency';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = { Umbrella, Plane, Laptop, Home, Car, GraduationCap, Heart, Star, ShoppingBag, Smartphone };

function ProgressBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  return (
    <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}60` }} />
    </div>
  );
}

export default function GoalsPage() {
  const { goals, updateGoal, deleteGoal, currency } = useFinance();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const totalSaved = goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const handleUpdate = (id: string) => {
    const val = parseFloat(editAmount);
    if (!isNaN(val) && val >= 0) updateGoal(id, { current: val });
    setEditId(null);
    setEditAmount('');
  };

  return (
    <AppShell>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Goals', value: String(goals.length), color: 'var(--accent-brand)' },
          { label: 'Total Saved', value: formatCurrency(totalSaved, currency, 0), color: 'var(--accent-green)' },
          { label: 'Overall Progress', value: `${overallPct}%`, color: 'var(--accent-blue)' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="card p-4">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Your Goals</h2>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
          <Plus size={14} /> New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
          <Star size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 4 }}>No goals yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Set financial targets and track your progress toward them.</p>
          <button onClick={() => setAddOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>Create first goal</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {goals.map((goal, i) => {
            const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
            const remaining = goal.target - goal.current;
            const Icon = iconMap[goal.icon] || Star;
            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="card p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${goal.color}15`, border: `1px solid ${goal.color}25` }}>
                      <Icon size={18} style={{ color: goal.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{goal.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due {goal.deadline}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteGoal(goal.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors"
                    style={{ color: 'var(--text-muted)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    {editId === goal.id ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus value={editAmount} onChange={e => setEditAmount(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdate(goal.id); if (e.key === 'Escape') { setEditId(null); setEditAmount(''); } }}
                          className="px-2 py-1 rounded-lg w-28 outline-none text-sm"
                          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }} />
                        <button onClick={() => handleUpdate(goal.id)} style={{ color: 'var(--accent-green)' }}><Check size={14} /></button>
                        <button onClick={() => { setEditId(null); setEditAmount(''); }} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 20, fontWeight: 700, color: goal.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>
                          {formatCurrency(goal.current, currency, 0)}
                        </span>
                        <button onClick={() => { setEditId(goal.id); setEditAmount(String(goal.current)); }}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5 transition-colors"
                          style={{ color: 'var(--text-muted)' }}>
                          <Edit2 size={11} />
                        </button>
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      of <span style={{ fontFamily: 'Geist Mono, monospace' }}>{formatCurrency(goal.target, currency, 0)}</span> target
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontSize: 28, fontWeight: 700, color: pct >= 100 ? 'var(--accent-green)' : 'var(--text-primary)', fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>
                      {pct}%
                    </div>
                    {remaining > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatCurrency(remaining, currency, 0)} left</div>
                    )}
                  </div>
                </div>

                <ProgressBar pct={pct} color={goal.color} delay={0.3 + i * 0.08} />

                {pct >= 100 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <Check size={13} style={{ color: 'var(--accent-green)' }} />
                    <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 500 }}>Goal reached! 🎉</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <Suspense fallback={null}>
        <AddGoalModal open={addOpen} onClose={() => setAddOpen(false)} />
      </Suspense>
    </AppShell>
  );
}
