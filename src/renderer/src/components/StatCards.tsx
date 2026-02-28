import { motion } from 'framer-motion';
import { Wallet, CreditCard, TrendingDown, TrendingUp } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Link } from 'react-router-dom';

export default function StatCards() {
  const {
    totalBalance, creditUtilization, accounts,
    monthlyExpenses, monthlySaved, savingsRate,
  } = useFinance();

  const creditCard = accounts.find(a => a.type === 'credit');
  const investmentAccount = accounts.find(a => a.type === 'investment');

  const stats = [
    {
      label: 'Total Balance',
      value: `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `Across ${accounts.filter(a => a.type !== 'credit').length} accounts`,
      icon: Wallet,
      color: '#4ade80',
      trend: accounts.filter(a => a.type !== 'credit').length > 0 ? 'All accounts' : 'No accounts',
      good: totalBalance > 0,
      href: '/accounts',
    },
    {
      label: 'Credit Utilization',
      value: `${creditUtilization}%`,
      sub: creditCard ? `$${Math.abs(creditCard.balance).toLocaleString()} of $${creditCard.limit?.toLocaleString()}` : '—',
      icon: CreditCard,
      color: '#60a5fa',
      trend: creditUtilization < 30 ? 'Healthy' : 'High',
      good: creditUtilization < 30,
      href: '/accounts#credit',
    },
    {
      label: 'Monthly Spend',
      value: `$${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      sub: `${savingsRate}% savings rate`,
      icon: TrendingDown,
      color: '#f59e0b',
      trend: `$${monthlySaved.toFixed(0)} saved`,
      good: monthlySaved > 0,
      href: '/budget',
    },
    {
      label: 'Investments',
      value: investmentAccount ? `$${investmentAccount.balance.toLocaleString()}` : '$0',
      sub: investmentAccount ? 'Investment portfolio' : 'No investment account',
      icon: TrendingUp,
      color: '#a78bfa',
      trend: investmentAccount ? 'Portfolio' : '—',
      good: !!investmentAccount,
      href: '/investments',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat, i) => (
        <motion.div key={stat.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}>
          <Link to={stat.href} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="card p-4 flex flex-col gap-3 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
                  <stat.icon size={16} strokeWidth={2.5} style={{ color: stat.color }} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{
                    color: stat.good ? 'var(--accent-green)' : 'var(--text-primary)',
                    background: stat.good ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)',
                  }}>
                  {stat.trend}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>{stat.sub}</div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
