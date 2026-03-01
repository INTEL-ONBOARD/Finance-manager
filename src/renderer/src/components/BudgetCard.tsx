import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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

export default function BudgetCard() {
  const { monthlyIncome, monthlyExpenses, monthlySaved, savingsRate, currency } = useFinance();
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
  const chartData = [
    { month: currentMonth, income: Math.round(monthlyIncome), expenses: Math.round(monthlyExpenses) },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly Budget</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        <Link to="/budget" className="flex items-center gap-1 text-sm font-semibold group transition-colors" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Details <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Income', value: formatCurrency(Math.round(monthlyIncome), currency, 0), color: 'var(--accent-green)' },
          { label: 'Expenses', value: formatCurrency(Math.round(monthlyExpenses), currency, 0), color: 'var(--accent-red)' },
          { label: 'Saved', value: formatCurrency(Math.round(monthlySaved), currency, 0), color: 'var(--accent-blue)', sub: `${savingsRate}%` },
        ].map(item => (
          <div key={item.label} className="rounded-[10px] p-3 transition-colors hover:bg-[var(--bg-card-hover)]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: item.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{item.value}</div>
            {item.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4 }}>{item.sub} rate</div>}
          </div>
        ))}
      </div>

      <div style={{ height: 100, marginLeft: -8, marginRight: -8, overflow: 'visible' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,55,72,0.4)" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Geist Mono, monospace' }} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[3, 3, 0, 0]} opacity={0.8} />
            <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[3, 3, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
