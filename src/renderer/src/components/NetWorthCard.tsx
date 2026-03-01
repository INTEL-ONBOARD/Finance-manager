import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatCurrency';

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl shadow-xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', fontSize: 12 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{payload[0].payload.month}</div>
      <div style={{ color: 'var(--accent-brand)', fontFamily: 'Geist Mono, monospace', fontWeight: 600 }}>
        {formatCurrency(payload[0].value, currency, 0)}
      </div>
    </div>
  );
};

export default function NetWorthCard() {
  const { netWorth, accounts, monthlyIncome, monthlySaved, currency } = useFinance();
  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalLiab = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlySaved / monthlyIncome) * 100) : 0;

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
  const chartData = [{ month: currentMonth, value: Math.round(netWorth) }];

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Net Worth
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 4 }}>
            {formatCurrency(netWorth, currency, 0)}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold"
              style={{ background: netWorth >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)', color: netWorth >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              <TrendingUp size={12} strokeWidth={3} /> Net Worth
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Assets minus liabilities</span>
          </div>
        </div>
        <Link to="/accounts" className="flex items-center gap-1 text-sm font-semibold group transition-colors" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Details <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Assets', value: formatCurrency(totalAssets, currency, 0), color: 'var(--accent-green)' },
          { label: 'Liabilities', value: formatCurrency(totalLiab, currency, 0), color: 'var(--accent-red)' },
          { label: 'Savings Rate', value: `${savingsRate}%`, color: 'var(--accent-blue)' },
        ].map(item => (
          <div key={item.label} className="rounded-[10px] p-3 transition-colors hover:bg-[var(--bg-card-hover)]"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: item.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 100, marginLeft: -8, marginRight: -8, overflow: 'visible' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Geist Mono, monospace' }} />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2}
              fill="url(#nwGrad)" dot={false} activeDot={{ r: 4, fill: '#4ade80', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
