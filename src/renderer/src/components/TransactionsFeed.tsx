import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Plus, ShoppingCart, Utensils, Zap, Car, Home, Dumbbell, Wifi, Music, ArrowDownLeft, Tv, Package, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinance, Transaction } from '@/context/FinanceContext';
import AddTransactionModal from './modals/AddTransactionModal';
import TransactionDetailModal from './modals/TransactionDetailModal';
import { formatCurrency } from '@/utils/formatCurrency';

type Tab = 'All' | 'Income' | 'Food' | 'Transport' | 'Bills';

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

const filterMap: Record<Tab, (t: Transaction) => boolean> = {
  All: () => true,
  Income: t => t.amount > 0,
  Food: t => ['Groceries', 'Dining'].includes(t.category),
  Transport: t => t.category === 'Transport',
  Bills: t => ['Rent', 'Utilities', 'Internet', 'Spotify', 'Netflix', 'Gym'].includes(t.category),
};

const TABS: Tab[] = ['All', 'Income', 'Food', 'Transport', 'Bills'];

export default function TransactionsFeed() {
  const { transactions, currency } = useFinance();
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const filtered = transactions.filter(filterMap[activeTab]).slice(0, 10);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="card p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between pointer-events-none pb-2">
          <Link to="/transactions" className="flex items-center gap-1 group pointer-events-auto transition-colors" style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', textDecoration: 'none' }}>
            Recent Transactions
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex gap-1">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="relative px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                  style={{ color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {activeTab === tab && (
                    <motion.div layoutId="txn-tab" className="absolute inset-0 rounded-[10px]"
                      style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-light)' }}
                      transition={{ duration: 0.15 }} />
                  )}
                  <span className="relative">{tab}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[10px] text-xs font-bold transition-all hover:brightness-110 shadow-sm"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              <Plus size={12} strokeWidth={3} /> Add
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col">
          {filtered.length === 0 ? (
            <div className="py-8 text-center" style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>No transactions found</div>
          ) : (
            filtered.map((txn, i) => {
              const Icon = iconMap[txn.category] || Package;
              const color = colorMap[txn.category] || '#94a3b8';
              return (
                <motion.div key={txn.id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="flex items-center gap-3 py-2.5 cursor-pointer group"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onClick={() => setSelected(txn)}
                >
                  <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Icon size={16} strokeWidth={2.5} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }} className="truncate group-hover:text-blue-400 transition-colors">
                        {txn.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                        style={{ background: `${color}15`, color }}>{txn.category}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{txn.date}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace', fontWeight: 500 }}>{txn.account}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Geist Mono, monospace', color: txn.amount > 0 ? 'var(--accent-green)' : 'var(--text-primary)', flexShrink: 0 }}>
                    {txn.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount), currency)}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {transactions.length > 10 && (
          <Link to="/transactions" className="text-center text-xs py-1 rounded-lg hover:bg-[var(--bg-card)]/5 transition-colors"
            style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'block' }}>
            View all {transactions.length} transactions →
          </Link>
        )}
      </motion.div>

      <AddTransactionModal open={addOpen} onClose={() => setAddOpen(false)} />
      <TransactionDetailModal transaction={selected} onClose={() => setSelected(null)} />
    </>
  );
}
