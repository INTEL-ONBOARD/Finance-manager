import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Plus, Trash2, Umbrella, Plane, Laptop, Home, Car, GraduationCap, Heart, Star, ShoppingBag, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import AddGoalModal from './modals/AddGoalModal';

const iconMap: Record<string, any> = {
  Umbrella, Plane, Laptop, Home, Car, GraduationCap, Heart, Star, ShoppingBag, Smartphone,
};

function ProgressBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color }} />
    </div>
  );
}

export default function SavingsGoals() {
  const { goals, deleteGoal } = useFinance();
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Link to="/goals" className="flex items-center gap-1 group" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            Savings Goals
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <button onClick={() => setAddOpen(true)}
            className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-blue-500/10 flex items-center gap-1"
            style={{ color: 'var(--accent-blue)', border: '1px solid rgba(96,165,250,0.2)' }}>
            <Plus size={11} /> Add Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="py-6 text-center">
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>No goals yet</p>
            <button onClick={() => setAddOpen(true)} className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--accent-brand-dim)', color: 'var(--accent-brand)', border: '1px solid rgba(74,222,128,0.2)' }}>
              Create your first goal
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {goals.map((goal, i) => {
              const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
              const remaining = goal.target - goal.current;
              const Icon = iconMap[goal.icon] || Star;
              return (
                <motion.div key={goal.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
                  className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${goal.color}15`, border: `1px solid ${goal.color}25` }}>
                      <Icon size={14} style={{ color: goal.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{goal.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-1.5 py-0.5 rounded-md font-bold" style={{ color: goal.color, background: `${goal.color}15`, fontFamily: 'Geist Mono, monospace' }}>{pct}%</span>
                          {confirmDelete === goal.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => { deleteGoal(goal.id); setConfirmDelete(null); }}
                                className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--accent-red)' }}>
                                Delete
                              </button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(goal.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: 'var(--text-muted)' }}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace', fontWeight: 500 }}>
                          ${goal.current.toLocaleString()} <span style={{ color: 'var(--text-secondary)' }}>/ ${goal.target.toLocaleString()}</span>
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{goal.deadline}</span>
                      </div>
                    </div>
                  </div>
                  <ProgressBar pct={pct} color={goal.color} delay={0.4 + i * 0.08} />
                  {pct >= 80 && remaining > 0 && (
                    <div className="mt-1 text-right">
                      <span style={{ fontSize: 10, color: goal.color }}>Only ${remaining.toLocaleString()} to go!</span>
                    </div>
                  )}
                  {pct >= 100 && (
                    <div className="mt-1 text-right">
                      <span style={{ fontSize: 10, color: 'var(--accent-green)' }}>🎉 Goal reached!</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <AddGoalModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
