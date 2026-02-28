import { useMemo } from 'react';
import { motion } from 'framer-motion';
import AppShell from '@/components/AppShell';
import { useFinance } from '@/context/FinanceContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  Rent: '#f87171', Groceries: '#f59e0b', Dining: '#f97316',
  Transport: '#a78bfa', Utilities: '#60a5fa', Health: '#34d399',
  Netflix: '#f87171', Spotify: '#4ade80', Internet: '#60a5fa',
  Gym: '#34d399', Shopping: '#fbbf24', Other: '#64748b',
};

const BUDGET_LIMITS: Record<string, number> = {
  Rent: 1500, Groceries: 400, Dining: 250, Transport: 150,
  Utilities: 200, Health: 100, Shopping: 200, Entertainment: 150,
};

const historicalData = [
  { month: 'Sep', income: 5200, expenses: 3900 },
  { month: 'Oct', income: 5200, expenses: 4100 },
  { month: 'Nov', income: 5600, expenses: 3700 },
  { month: 'Dec', income: 5200, expenses: 4800 },
  { month: 'Jan', income: 5200, expenses: 3950 },
];

export default function BudgetPage() {
  const { transactions, monthlyIncome, monthlyExpenses, monthlySaved, savingsRate } = useFinance();

  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const currentMonthLabel  = new Date().toLocaleString('default', { month: 'short' }); // "Mar"

  const categoryBreakdown = useMemo(() => {
    const expenses = transactions.filter(t => t.amount < 0 && t.date.startsWith(currentMonthPrefix));
    const totals: Record<string, number> = {};
    expenses.forEach(t => { totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount); });
    return Object.entries(totals).map(([cat, spent]) => ({
      category: cat, spent,
      limit: BUDGET_LIMITS[cat] || 0,
      color: CATEGORY_COLORS[cat] || '#64748b',
      pct: BUDGET_LIMITS[cat] ? Math.round((spent / BUDGET_LIMITS[cat]) * 100) : null,
    })).sort((a, b) => b.spent - a.spent);
  }, [transactions, currentMonthPrefix]);

  const chartData = [...historicalData, { month: currentMonthLabel, income: Math.round(monthlyIncome), expenses: Math.round(monthlyExpenses) }];

  return (
    <AppShell>
      {/* Top stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Income', value: `$${Math.round(monthlyIncome).toLocaleString()}`, color: 'var(--accent-green)' },
          { label: 'Expenses', value: `$${Math.round(monthlyExpenses).toLocaleString()}`, color: 'var(--accent-red)' },
          { label: 'Saved', value: `$${Math.round(monthlySaved).toLocaleString()}`, color: 'var(--accent-blue)' },
          { label: 'Savings Rate', value: `${savingsRate}%`, color: savingsRate >= 20 ? 'var(--accent-green)' : 'var(--accent-yellow)' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="card p-4">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card p-5">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Income vs Expenses</h3>
          <div style={{ height: 200, overflow: 'visible' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,55,72,0.4)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Geist Mono, monospace' }} />
                <YAxis tickLine={false} axisLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Geist Mono, monospace' }} width={44} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-muted)' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="card p-5">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Spending by Category</h3>
          <div className="flex gap-4">
            <div style={{ width: 140, height: 140, flexShrink: 0, overflow: 'visible' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="spent" innerRadius={40} outerRadius={62} paddingAngle={2} strokeWidth={0}>
                    {categoryBreakdown.map(e => <Cell key={e.category} fill={e.color} opacity={0.9} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 flex flex-col gap-1.5 justify-center">
              {categoryBreakdown.slice(0, 5).map(c => (
                <div key={c.category} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{c.category}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>${c.spent.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Budget limits */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="card p-5">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Category Budgets</h3>
        <div className="grid grid-cols-2 gap-4">
          {categoryBreakdown.filter(c => c.limit > 0).map((cat, i) => {
            const pct = Math.min(Math.round((cat.spent / cat.limit) * 100), 100);
            const overBudget = cat.spent > cat.limit;
            return (
              <motion.div key={cat.category} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.04 }}>
                <div className="flex justify-between items-center mb-1.5">
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{cat.category}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 11, fontFamily: 'Geist Mono, monospace', color: overBudget ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                      ${cat.spent.toFixed(0)} / ${cat.limit}
                    </span>
                    {overBudget && <span style={{ fontSize: 10, color: 'var(--accent-red)' }}>Over!</span>}
                  </div>
                </div>
                <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.4 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: overBudget ? '#f87171' : cat.color }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AppShell>
  );
}
