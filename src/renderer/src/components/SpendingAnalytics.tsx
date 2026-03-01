import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatCurrency';

const CATEGORY_COLORS: Record<string, string> = {
  Rent: '#f87171', Groceries: '#f59e0b', Dining: '#f97316',
  Transport: '#a78bfa', Utilities: '#60a5fa', Health: '#34d399',
  Netflix: '#f87171', Spotify: '#4ade80', Internet: '#60a5fa',
  Gym: '#34d399', Shopping: '#fbbf24', Other: '#64748b',
};

const PieTooltip = ({ active, payload, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl shadow-xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', fontSize: 12 }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>{payload[0].name}</div>
      <div style={{ color: payload[0].payload.color, fontFamily: 'Geist Mono, monospace', fontWeight: 600 }}>
        {formatCurrency(payload[0].value, currency)}
      </div>
    </div>
  );
};

type View = 'breakdown' | 'weekly';

export default function SpendingAnalytics() {
  const { transactions, currency, selectedMonth } = useFinance();
  const [view, setView] = useState<View>('breakdown');

  const spendingCategories = useMemo(() => {
    const expenses = transactions.filter(t => t.amount < 0 && t.date.startsWith(selectedMonth));
    const totals: Record<string, number> = {};
    expenses.forEach(t => { totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount); });
    const total = Object.values(totals).reduce((s, v) => s + v, 0);
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || '#64748b', pct: Math.round((value / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, selectedMonth]);

  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    return days.map((day, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const amount = transactions.filter(t => t.date === dateStr && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      return { day, amount: Math.round(amount * 100) / 100 };
    });
  }, [transactions]);

  const total = spendingCategories.reduce((s, c) => s + c.value, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between pointer-events-none pb-2">
        <Link to="/budget" className="flex items-center gap-1 group pointer-events-auto transition-colors" style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', textDecoration: 'none' }}>
          Spending Analytics
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <div className="flex gap-1 pointer-events-auto">
          {(['breakdown', 'weekly'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="relative px-2.5 py-1 rounded-lg text-xs font-semibold capitalize"
              style={{ color: view === v ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {view === v && (
                <motion.div layoutId="analytics-tab" className="absolute inset-0 rounded-[10px]"
                  style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-light)' }}
                  transition={{ duration: 0.15 }} />
              )}
              <span className="relative">{v === 'breakdown' ? 'Category' : 'This Week'}</span>
            </button>
          ))}
        </div>
      </div>

      {view === 'breakdown' ? (
        <div className="flex gap-4">
          <div style={{ width: 140, height: 140, flexShrink: 0, overflow: 'visible' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={spendingCategories} dataKey="value" innerRadius={42} outerRadius={65}
                  paddingAngle={2} startAngle={90} endAngle={-270} strokeWidth={0}>
                  {spendingCategories.map(entry => <Cell key={entry.name} fill={entry.color} opacity={0.9} />)}
                </Pie>
                <Tooltip content={<PieTooltip currency={currency} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1.5 justify-center pl-2">
            {spendingCategories.slice(0, 6).map(cat => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                <span className="flex-1 text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
                <span className="text-xs font-bold shrink-0" style={{ color: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace' }}>{formatCurrency(cat.value, currency, 0)}</span>
                <span className="text-[11px] font-medium w-8 text-right shrink-0" style={{ color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>{cat.pct}%</span>
              </div>
            ))}
            <div className="mt-1 pt-1.5" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex justify-between items-center pr-1">
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Total this month</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent-red)', fontFamily: 'Geist Mono, monospace' }}>{formatCurrency(total, currency, 0)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ height: 160, overflow: 'visible' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Geist Mono, monospace' }} />
              <YAxis tickLine={false} axisLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Geist Mono, monospace' }} width={36} />
              <Tooltip
                formatter={(v: number | undefined) => [formatCurrency(v ?? 0, currency, 0), 'Spent']}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-muted)' }} itemStyle={{ color: '#f59e0b' }}
                cursor={{ fill: 'var(--border)', opacity: 0.3 }} />
              <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
