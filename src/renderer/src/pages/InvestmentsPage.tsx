import { motion } from 'framer-motion';
import AppShell from '@/components/AppShell';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatCurrency';

const portfolioHistory = [
  { month: 'Aug', value: 6800 }, { month: 'Sep', value: 7100 },
  { month: 'Oct', value: 6900 }, { month: 'Nov', value: 7400 },
  { month: 'Dec', value: 7800 }, { month: 'Jan', value: 7950 },
  { month: 'Feb', value: 8240 },
];

const holdings = [
  { name: 'S&P 500 ETF', ticker: 'VOO',  shares: 12,   price: 432.50, cost: 400.00, color: '#4ade80' },
  { name: 'Apple Inc.',   ticker: 'AAPL', shares: 8,    price: 228.14, cost: 190.00, color: '#60a5fa' },
  { name: 'Tesla Inc.',   ticker: 'TSLA', shares: 5,    price: 411.20, cost: 480.00, color: '#f87171' },
  { name: 'NVIDIA Corp',  ticker: 'NVDA', shares: 3,    price: 127.34, cost: 110.00, color: '#a78bfa' },
  { name: 'Bitcoin ETF',  ticker: 'IBIT', shares: 20,   price: 38.42,  cost: 35.00,  color: '#fbbf24' },
];

export default function InvestmentsPage() {
  const { currency } = useFinance();
  const totalValue = holdings.reduce((s, h) => s + h.shares * h.price, 0);
  const totalCost  = holdings.reduce((s, h) => s + h.shares * h.cost, 0);
  const totalGain  = totalValue - totalCost;
  const totalPct   = ((totalGain / totalCost) * 100).toFixed(1);

  return (
    <AppShell>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Portfolio Value',    value: formatCurrency(totalValue, currency, 0),                                                        color: 'var(--accent-brand)' },
          { label: 'Total Gain / Loss',  value: `${totalGain >= 0 ? '+' : ''}${formatCurrency(Math.abs(totalGain), currency, 0)}`,                color: totalGain >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
          { label: 'All-Time Return',    value: `${Number(totalPct) >= 0 ? '+' : ''}${totalPct}%`,                       color: Number(totalPct) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="card p-4">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="card p-5">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Portfolio Value Over Time</h3>
        <div style={{ height: 200, overflow: 'visible' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={portfolioHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Geist Mono, monospace' }} />
              <YAxis tickLine={false} axisLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Geist Mono, monospace' }} width={48} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 10, fontSize: 12 }}
                formatter={(v: number | undefined) => [formatCurrency(v ?? 0, currency, 0), 'Value']}
                labelStyle={{ color: 'var(--text-muted)' }} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} fill="url(#portGrad)"
                dot={false} activeDot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="card p-5">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Holdings</h3>
        <div className="flex flex-col">
          <div className="grid grid-cols-5 pb-2 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
            {['Asset', 'Shares', 'Price', 'Value', 'Gain/Loss'].map(h => (
              <span key={h} style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</span>
            ))}
          </div>
          {holdings.map((h, i) => {
            const value = h.shares * h.price;
            const cost  = h.shares * h.cost;
            const gain  = value - cost;
            const pct   = ((gain / cost) * 100).toFixed(1);
            return (
              <motion.div key={h.ticker} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="grid grid-cols-5 py-3 items-center"
                style={{ borderBottom: i < holdings.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${h.color}15`, border: `1px solid ${h.color}25` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: h.color }}>{h.ticker.charAt(0)}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{h.ticker}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{h.name}</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace' }}>{h.shares}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>{formatCurrency(h.price, currency)}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>{formatCurrency(value, currency, 0)}</span>
                <div className="flex items-center gap-1" style={{ color: gain >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {gain >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span style={{ fontSize: 12, fontFamily: 'Geist Mono, monospace', fontWeight: 600 }}>
                    {gain >= 0 ? '+' : ''}{formatCurrency(Math.abs(gain), currency, 0)} ({pct}%)
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AppShell>
  );
}
