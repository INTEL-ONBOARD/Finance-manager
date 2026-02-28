import { motion } from 'framer-motion';
import { Wallet, CreditCard, TrendingUp, PiggyBank } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useFinance } from '@/context/FinanceContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typeIcon: Record<string, any> = { checking: Wallet, savings: PiggyBank, credit: CreditCard, investment: TrendingUp };
const typeLabel: Record<string, string> = { checking: 'Checking', savings: 'Savings', credit: 'Credit Card', investment: 'Investment' };

export default function AccountsPage() {
  const { accounts, transactions } = useFinance();
  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalDebt   = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);

  return (
    <AppShell>
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Assets', value: `$${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--accent-green)' },
          { label: 'Total Debt',   value: `$${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,   color: 'var(--accent-red)' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="card p-4">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Accounts */}
      <div className="grid grid-cols-2 gap-4">
        {accounts.map((acct, i) => {
          const Icon = typeIcon[acct.type] || Wallet;
          const recentTxns = transactions.filter(t => t.account === acct.name).slice(0, 3);
          return (
            <motion.div key={acct.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${acct.color}15`, border: `1px solid ${acct.color}25` }}>
                    <Icon size={18} style={{ color: acct.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{acct.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{typeLabel[acct.type]}</div>
                  </div>
                </div>
                {acct.type === 'credit' && acct.limit && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>
                    Limit: ${acct.limit.toLocaleString()}
                  </span>
                )}
              </div>

              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em', color: acct.balance < 0 ? 'var(--accent-red)' : 'var(--text-primary)', marginBottom: 4 }}>
                {acct.balance < 0 ? '-' : ''}${Math.abs(acct.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Current balance</div>

              {acct.type === 'credit' && acct.limit && (
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Utilization</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>
                      {Math.round((Math.abs(acct.balance) / acct.limit) * 100)}%
                    </span>
                  </div>
                  <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((Math.abs(acct.balance) / acct.limit) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: acct.color }} />
                  </div>
                </div>
              )}

              {recentTxns.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Recent</div>
                  {recentTxns.map(t => (
                    <div key={t.id} className="flex justify-between items-center py-1">
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }} className="truncate">{t.name}</span>
                      <span style={{ fontSize: 11, fontFamily: 'Geist Mono, monospace', color: t.amount > 0 ? 'var(--accent-green)' : 'var(--text-primary)', flexShrink: 0, marginLeft: 8 }}>
                        {t.amount > 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </AppShell>
  );
}
