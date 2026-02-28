import { useState, useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, X, ShoppingCart, Utensils, Zap, Car, Home, Dumbbell, Wifi, Music, ArrowDownLeft, Tv, Package, Heart, Filter } from 'lucide-react';
import AppShell from '@/components/AppShell';
const AddTransactionModal = lazy(() => import('@/components/modals/AddTransactionModal'));
const TransactionDetailModal = lazy(() => import('@/components/modals/TransactionDetailModal'));
import { useFinance, Transaction, TransactionCategory } from '@/context/FinanceContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = {
  Groceries: ShoppingCart, Dining: Utensils, Utilities: Zap, Transport: Car,
  Rent: Home, Gym: Dumbbell, Internet: Wifi, Spotify: Music, Netflix: Tv,
  Salary: ArrowDownLeft, Freelance: ArrowDownLeft, Investment: ArrowDownLeft,
  Shopping: Package, Health: Heart, Other: Package, Refund: ArrowDownLeft,
};
const colorMap: Record<string, string> = {
  Groceries: '#f59e0b', Dining: '#f97316', Utilities: '#60a5fa', Transport: '#a78bfa',
  Rent: '#f87171', Gym: '#34d399', Internet: '#60a5fa', Spotify: '#4ade80',
  Netflix: '#f87171', Salary: '#22c55e', Freelance: '#4ade80', Investment: '#a78bfa',
  Shopping: '#f59e0b', Health: '#34d399', Other: '#64748b', Refund: '#22c55e',
};

const ALL_CATEGORIES: TransactionCategory[] = [
  'Salary', 'Freelance', 'Investment', 'Refund',
  'Groceries', 'Dining', 'Transport', 'Utilities',
  'Rent', 'Gym', 'Internet', 'Spotify', 'Netflix',
  'Shopping', 'Health', 'Other',
];

export default function TransactionsPage() {
  const { transactions, monthlyIncome, monthlyExpenses, monthlySaved } = useFinance();
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<TransactionCategory | 'All'>('All');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'All' || t.category === filterCategory;
      const matchType = filterType === 'all' || (filterType === 'income' ? t.amount > 0 : t.amount < 0);
      return matchSearch && matchCat && matchType;
    });
  }, [transactions, search, filterCategory, filterType]);

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  return (
    <AppShell>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Income this month',   value: `$${monthlyIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,  color: 'var(--accent-green)' },
          { label: 'Expenses this month', value: `$${monthlyExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'var(--accent-red)' },
          { label: 'Net saved',           value: `$${monthlySaved.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,    color: monthlySaved >= 0 ? 'var(--accent-blue)' : 'var(--accent-red)' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="card p-4">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or category..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }} />
            {search && <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)' }}><X size={12} /></button>}
          </div>

          <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            {(['all', 'income', 'expense'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background: filterType === t ? 'var(--bg-card)' : 'transparent',
                  color: filterType === t ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: filterType === t ? '1px solid var(--border-light)' : '1px solid transparent',
                }}>{t}</button>
            ))}
          </div>

          <button onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: showFilters ? 'rgba(96,165,250,0.1)' : 'var(--bg-primary)',
              color: showFilters ? 'var(--accent-blue)' : 'var(--text-secondary)',
              border: `1px solid ${showFilters ? 'rgba(96,165,250,0.3)' : 'var(--border)'}`,
            }}>
            <Filter size={13} /> Filters
          </button>

          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-110"
            style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
            <Plus size={13} /> Add Transaction
          </button>
        </div>

        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {(['All', ...ALL_CATEGORIES] as (TransactionCategory | 'All')[]).map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: filterCategory === cat ? 'rgba(96,165,250,0.12)' : 'var(--bg-primary)',
                    color: filterCategory === cat ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    border: `1px solid ${filterCategory === cat ? 'rgba(96,165,250,0.3)' : 'var(--border)'}`,
                  }}>{cat}</button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>All Transactions</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} results</span>
        </div>

        {grouped.length === 0 ? (
          <div className="py-12 text-center">
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No transactions match your filters</p>
            <button onClick={() => { setSearch(''); setFilterCategory('All'); setFilterType('all'); }}
              className="mt-3 text-xs px-3 py-1.5 rounded-lg" style={{ color: 'var(--accent-blue)', border: '1px solid rgba(96,165,250,0.2)' }}>
              Clear filters
            </button>
          </div>
        ) : (
          grouped.map(([date, txns]) => (
            <div key={date} className="mb-4">
              <div className="mb-2 pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Geist Mono, monospace' }}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              {txns.map((txn, i) => {
                const Icon = iconMap[txn.category] || Package;
                const color = colorMap[txn.category] || '#94a3b8';
                return (
                  <motion.div key={txn.id}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-3 py-2.5 cursor-pointer group rounded-lg px-2 -mx-2 transition-colors hover:bg-white/3"
                    onClick={() => setSelected(txn)}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">{txn.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                          style={{ background: `${color}15`, color }}>{txn.category}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>{txn.account}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Geist Mono, monospace', color: txn.amount > 0 ? 'var(--accent-green)' : 'var(--text-primary)', flexShrink: 0 }}>
                      {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
      </motion.div>

      <Suspense fallback={null}>
        <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} />
        <TransactionDetailModal transaction={selected} onClose={() => setSelected(null)} />
      </Suspense>
    </AppShell>
  );
}
