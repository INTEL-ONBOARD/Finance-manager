import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Home, Zap, Wifi, Tv, Dumbbell, Shield, Plus, Trash2, Pencil } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useFinance } from '@/context/FinanceContext';
import type { Bill } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatCurrency';
const AddBillModal = lazy(() => import('@/components/modals/AddBillModal'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = {
  Housing: Home, Utilities: Zap, Internet: Wifi, Subscription: Tv,
  Health: Dumbbell, Insurance: Shield,
};
const categoryColor: Record<string, string> = {
  Housing: '#f87171', Utilities: '#60a5fa', Subscription: '#4ade80',
  Health: '#34d399', Insurance: '#fbbf24',
};

export default function BillsPage() {
  const { bills, toggleBillPaid, deleteBill, currency } = useFinance();
  const today = new Date().getDate();
  const [addOpen, setAddOpen] = useState(false);
  const [editBill, setEditBill] = useState<Bill | null>(null);

  const paid   = bills.filter(b => b.paid);
  const unpaid = bills.filter(b => !b.paid);
  const totalMonthly = bills.reduce((s, b) => s + b.amount, 0);
  const totalPaid    = paid.reduce((s, b) => s + b.amount, 0);
  const totalDue     = unpaid.reduce((s, b) => s + b.amount, 0);

  const isOverdue = (b: typeof bills[0]) => !b.paid && b.dueDay < today;
  const isDueSoon = (b: typeof bills[0]) => !b.paid && b.dueDay >= today && b.dueDay <= today + 3;

  return (
    <AppShell>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Monthly Total', value: formatCurrency(totalMonthly, currency), color: 'var(--text-primary)' },
          { label: 'Paid',          value: formatCurrency(totalPaid, currency),    color: 'var(--accent-green)' },
          { label: 'Still Due',     value: formatCurrency(totalDue, currency),     color: totalDue > 0 ? 'var(--accent-red)' : 'var(--accent-green)' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="card p-4">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress bar — only shown when there are bills */}
      {bills.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Payment Progress</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>
              {paid.length} / {bills.length} bills paid
            </span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${totalMonthly > 0 ? Math.round((totalPaid / totalMonthly) * 100) : 0}%` }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: 'linear-gradient(90deg, #22c55e, #4ade80)', boxShadow: '0 0 10px rgba(74,222,128,0.4)' }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span style={{ fontSize: 11, color: 'var(--accent-green)', fontFamily: 'Geist Mono, monospace' }}>
              {formatCurrency(totalPaid, currency, 0)} paid
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>
              {totalMonthly > 0 ? Math.round((totalPaid / totalMonthly) * 100) : 0}% of {formatCurrency(totalMonthly, currency, 0)}
            </span>
          </div>
        </motion.div>
      )}

      {/* Bills list */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Bills
          </h2>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
            style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
            <Plus size={14} /> Add Bill
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {bills.map((bill, i) => {
            const Icon = iconMap[bill.category] || Zap;
            const color = categoryColor[bill.category] || bill.color;
            const overdue = isOverdue(bill);
            const soon = isDueSoon(bill);
            return (
              <motion.div key={bill.id}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{
                  background: bill.paid ? 'rgba(34,197,94,0.04)' : overdue ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${bill.paid ? 'rgba(34,197,94,0.12)' : overdue ? 'rgba(248,113,113,0.2)' : 'var(--border)'}`,
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 13, fontWeight: 500, color: bill.paid ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: bill.paid ? 'line-through' : 'none' }}>
                      {bill.name}
                    </span>
                    {overdue && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--accent-red)' }}>Overdue</span>}
                    {soon && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'rgba(251,191,36,0.12)', color: 'var(--accent-yellow)' }}>Due soon</span>}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {bill.category} · Due {bill.dueDay}{['st','nd','rd','th'][Math.min((bill.dueDay % 10) - 1, 3)] || 'th'} of month
                  </span>
                </div>
                <div className="text-right mr-2">
                  <div style={{ fontSize: 14, fontWeight: 700, color: bill.paid ? 'var(--text-muted)' : 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>
                    {formatCurrency(bill.amount, currency)}
                  </div>
                </div>
                <button onClick={() => toggleBillPaid(bill.id)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
                  style={{
                    background: bill.paid ? 'rgba(34,197,94,0.15)' : 'var(--bg-card)',
                    border: `1px solid ${bill.paid ? 'rgba(34,197,94,0.3)' : 'var(--border-light)'}`,
                    color: bill.paid ? 'var(--accent-green)' : 'var(--text-muted)',
                  }}
                  title={bill.paid ? 'Mark unpaid' : 'Mark paid'}
                >
                  {bill.paid ? <Check size={14} /> : <Clock size={13} />}
                </button>
                <button onClick={() => setEditBill(bill)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  title="Edit bill"
                >
                  <Pencil size={13} />
                </button>
                <button onClick={() => deleteBill(bill.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  title="Delete bill"
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <Suspense fallback={null}>
        <AddBillModal open={addOpen} onClose={() => setAddOpen(false)} />
        <AddBillModal open={editBill !== null} onClose={() => setEditBill(null)} bill={editBill ?? undefined} />
      </Suspense>
    </AppShell>
  );
}
