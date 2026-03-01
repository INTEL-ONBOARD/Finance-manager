import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatCurrency';


const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl shadow-xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>
            {formatCurrency(p.value, currency, 0)}
          </span>
        </div>
      ))}
    </div>
  );
};

const CATEGORY_COLORS: Record<string, string> = {
  Rent: '#f87171', Groceries: '#f59e0b', Dining: '#f97316',
  Transport: '#a78bfa', Utilities: '#60a5fa', Health: '#34d399',
  Netflix: '#f87171', Spotify: '#4ade80', Internet: '#60a5fa',
  Gym: '#34d399', Shopping: '#fbbf24', Other: '#64748b',
};

export default function BudgetCard() {
  const { monthlyIncome, monthlyExpenses, monthlySaved, savingsRate, currency, bills, transactions, selectedMonth } = useFinance();
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
  const today = new Date().getDate();

  // Upcoming bills — unpaid, sorted by due day, show up to 3
  const upcomingBills = useMemo(() => {
    return bills
      .filter(b => !b.paid)
      .sort((a, b) => a.dueDay - b.dueDay)
      .slice(0, 3);
  }, [bills]);

  // All spending categories this month, sorted
  const topCategories = useMemo(() => {
    const expenses = transactions.filter(t => t.amount < 0 && t.date.startsWith(selectedMonth));
    const totals: Record<string, number> = {};
    expenses.forEach(t => { totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount); });
    const totalSpend = Object.values(totals).reduce((s, v) => s + v, 0);
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({
        cat,
        amt,
        pct: totalSpend > 0 ? Math.round((amt / totalSpend) * 100) : 0,
        color: CATEGORY_COLORS[cat] || '#64748b',
      }));
  }, [transactions, selectedMonth]);

  const expensePct = monthlyIncome > 0 ? Math.min(Math.round((monthlyExpenses / monthlyIncome) * 100), 100) : 0;
  const savedPct   = monthlyIncome > 0 ? Math.abs(Math.round((monthlySaved   / monthlyIncome) * 100))        : 0;

  const chartData = [
    { name: 'Income',   value: Math.round(monthlyIncome),   fill: '#22c55e' },
    { name: 'Expenses', value: Math.round(monthlyExpenses), fill: '#f87171' },
  ];

  const savedPositive = monthlySaved >= 0;
  const SavingsIcon = savingsRate === 0 ? Minus : savedPositive ? TrendingUp : TrendingDown;

  const stats = [
    {
      label: 'Income',
      value: formatCurrency(Math.round(monthlyIncome), currency, 0),
      color: 'var(--accent-green)',
      bar: 100,
      barColor: '#22c55e',
      sub: `${currentMonth} total`,
    },
    {
      label: 'Expenses',
      value: formatCurrency(Math.round(monthlyExpenses), currency, 0),
      color: 'var(--accent-red)',
      bar: expensePct,
      barColor: '#f87171',
      sub: `${expensePct}% of income`,
    },
    {
      label: 'Saved',
      value: formatCurrency(Math.abs(Math.round(monthlySaved)), currency, 0),
      color: savedPositive ? 'var(--accent-blue)' : 'var(--accent-red)',
      bar: savedPct,
      barColor: savedPositive ? '#60a5fa' : '#f87171',
      sub: `${savingsRate}% savings rate`,
      prefix: monthlySaved < 0 ? '-' : '',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="card p-5 flex flex-col gap-4 h-full">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Monthly Budget
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2, letterSpacing: '-0.01em' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        <Link to="/budget"
          className="flex items-center gap-1 group transition-colors"
          style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
          Details
          <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Stat rows — stacked vertically */}
      <div className="flex flex-col gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}>

            <div className="flex items-center justify-between mb-1.5">
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </span>
              <div className="flex items-baseline gap-1.5">
                {s.label === 'Saved' && (
                  <SavingsIcon size={11} style={{ color: s.color, strokeWidth: 2.5 }} />
                )}
                <span style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {s.prefix}{s.value}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.bar}%` }}
                transition={{ duration: 1, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: s.barColor, opacity: 0.85 }}
              />
            </div>

            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'Geist Mono, monospace' }}>
              {s.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Mini bar chart */}
      <div style={{ height: 80, marginLeft: -6, marginRight: -6, overflow: 'visible' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barGap={6}>
            <XAxis dataKey="name" tickLine={false} axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Geist Mono, monospace' }} />
            <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'var(--border)', opacity: 0.3 }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} opacity={0.85}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Upcoming bills */}
      {upcomingBills.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Upcoming Bills
            </span>
            <Link to="/bills" style={{ fontSize: 10, color: 'var(--accent-brand)', textDecoration: 'none', fontWeight: 600 }}>
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {upcomingBills.map((bill, i) => {
              const daysLeft = bill.dueDay - today;
              const overdue = daysLeft < 0;
              const dueSoon = daysLeft >= 0 && daysLeft <= 3;
              const StatusIcon = overdue ? AlertCircle : dueSoon ? Clock : CheckCircle2;
              const statusColor = overdue ? 'var(--accent-red)' : dueSoon ? 'var(--accent-yellow)' : 'var(--text-muted)';
              return (
                <motion.div key={bill.id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg"
                  style={{ background: overdue ? 'rgba(248,113,113,0.06)' : dueSoon ? 'rgba(251,191,36,0.05)' : 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <StatusIcon size={11} style={{ color: statusColor, flexShrink: 0 }} />
                  <span className="flex-1 truncate" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {bill.name}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'Geist Mono, monospace', fontWeight: 700, color: statusColor, flexShrink: 0 }}>
                    {overdue ? 'Overdue' : daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'Geist Mono, monospace', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {formatCurrency(bill.amount, currency, 0)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      {upcomingBills.length > 0 && topCategories.length > 0 && (
        <div style={{ height: 1, background: 'var(--border)' }} />
      )}

      {/* Top spending categories — flex-1 so it fills all remaining vertical space */}
      {topCategories.length > 0 ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Spending Breakdown
            </span>
            <Link to="/budget" style={{ fontSize: 10, color: 'var(--accent-brand)', textDecoration: 'none', fontWeight: 600 }}>
              Full breakdown
            </Link>
          </div>
          <div className="flex flex-col gap-2.5 flex-1">
            {topCategories.map((c, i) => (
              <motion.div key={c.cat}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.05 }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="flex-1 truncate" style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{c.cat}</span>
                  <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(c.amt, currency, 0)}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace', minWidth: 30, textAlign: 'right' }}>
                    {c.pct}%
                  </span>
                </div>
                <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.pct}%` }}
                    transition={{ duration: 0.9, delay: 0.7 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: c.color, opacity: 0.85 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pinned footer — quick nav */}
          <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <Link to="/transactions"
              className="flex-1 py-2 rounded-xl text-center transition-all hover:brightness-110"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Transactions
            </Link>
            <Link to="/bills"
              className="flex-1 py-2 rounded-xl text-center transition-all hover:brightness-110"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Bills
            </Link>
            <Link to="/goals"
              className="flex-1 py-2 rounded-xl text-center transition-all hover:brightness-110"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Goals
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          No spending recorded this month
        </div>
      )}
    </motion.div>
  );
}
