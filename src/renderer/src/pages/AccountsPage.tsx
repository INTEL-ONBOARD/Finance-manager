import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, CreditCard, TrendingUp, PiggyBank, Receipt, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useFinance } from '@/context/FinanceContext';
import type { Account } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatCurrency';
import AddAccountModal from '@/components/modals/AddAccountModal';

const typeIcon: Record<Account['type'], React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
  loan: Receipt,
};

const typeLabel: Record<Account['type'], string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit Card',
  investment: 'Investment',
  loan: 'Loan / Mortgage',
};

export default function AccountsPage() {
  const { accounts, transactions, currency, deleteAccount } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalDebt   = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);

  const handleEdit = (acct: Account) => {
    setEditAccount(acct);
    setMenuOpen(null);
    setModalOpen(true);
  };

  const handleDeleteConfirm = (id: string) => {
    setDeleteConfirm(null);
    setMenuOpen(null);
    deleteAccount(id);
  };

  const handleAddClick = () => {
    setEditAccount(undefined);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditAccount(undefined);
  };

  return (
    <AppShell>
      {/* Summary + Add button */}
      <div className="flex items-center gap-3 mb-2">
        {[
          { label: 'Total Assets', value: formatCurrency(totalAssets, currency), color: 'var(--accent-green)' },
          { label: 'Total Debt',   value: formatCurrency(totalDebt, currency),   color: 'var(--accent-red)' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="card p-4 flex-1">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
          </motion.div>
        ))}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          onClick={handleAddClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10, border: 'none',
            background: 'var(--accent-brand)', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap', alignSelf: 'center',
          }}
        >
          <Plus size={16} />
          Add Account
        </motion.button>
      </div>

      {/* Empty state */}
      {accounts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center"
          style={{ padding: '80px 24px', textAlign: 'center' }}
        >
          <div className="card flex items-center justify-center"
            style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 16, color: 'var(--text-muted)' }}>
            <Wallet size={28} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            No accounts yet
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 320 }}>
            Add your bank accounts to track balances, credit cards, loans, and investments in one place.
          </div>
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: 'var(--accent-brand)', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            Add Your First Account
          </button>
        </motion.div>
      )}

      {/* Accounts grid */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {accounts.map((acct, i) => {
            const Icon = typeIcon[acct.type] || Wallet;
            const recentTxns = transactions.filter(t => t.account === acct.name).slice(0, 3);
            const isMenuOpen = menuOpen === acct.id;
            const isDeleteConfirm = deleteConfirm === acct.id;

            const loanProgress = acct.type === 'loan' && acct.limit
              ? Math.max(0, Math.min(100, Math.round(((acct.limit - Math.abs(acct.balance)) / acct.limit) * 100)))
              : null;

            const creditUtil = acct.type === 'credit' && acct.limit
              ? Math.round((Math.abs(acct.balance) / acct.limit) * 100)
              : null;

            return (
              <motion.div
                key={acct.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="card p-5"
                style={{ position: 'relative' }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${acct.color}15`, border: `1px solid ${acct.color}25` }}>
                      <Icon size={18} style={{ color: acct.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{acct.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {typeLabel[acct.type]}
                        {acct.bank && <span> · {acct.bank.split(' ').slice(0, 2).join(' ')}</span>}
                        {acct.branch && <span>, {acct.branch}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Three-dot menu */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setMenuOpen(isMenuOpen ? null : acct.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    <AnimatePresence>
                      {isMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -4 }}
                          style={{
                            position: 'absolute', top: 28, right: 0, zIndex: 50,
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 10, padding: '4px', minWidth: 130,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                          }}
                        >
                          <button
                            onClick={() => handleEdit(acct)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              width: '100%', padding: '8px 12px', background: 'none',
                              border: 'none', cursor: 'pointer', borderRadius: 6,
                              color: 'var(--text-primary)', fontSize: 13,
                            }}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            onClick={() => { setDeleteConfirm(acct.id); setMenuOpen(null); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              width: '100%', padding: '8px 12px', background: 'none',
                              border: 'none', cursor: 'pointer', borderRadius: 6,
                              color: 'var(--accent-red)', fontSize: 13,
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Delete confirmation */}
                <AnimatePresence>
                  {isDeleteConfirm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 8, padding: '10px 12px', marginBottom: 12, overflow: 'hidden',
                      }}
                    >
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-secondary)' }}>
                        Delete this account? Linked transactions will remain.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{
                            fontSize: 12, padding: '4px 10px', borderRadius: 6,
                            border: '1px solid var(--border)', background: 'none',
                            cursor: 'pointer', color: 'var(--text-secondary)',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(acct.id)}
                          style={{
                            fontSize: 12, padding: '4px 10px', borderRadius: 6,
                            border: 'none', background: 'var(--accent-red)',
                            cursor: 'pointer', color: '#fff', fontWeight: 600,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Balance */}
                <div style={{
                  fontSize: 26, fontWeight: 700, fontFamily: 'Geist Mono, monospace',
                  letterSpacing: '-0.02em',
                  color: acct.balance < 0 ? 'var(--accent-red)' : 'var(--text-primary)',
                  marginBottom: 4,
                }}>
                  {formatCurrency(acct.balance, currency)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Current balance</div>

                {/* Credit utilization bar */}
                {creditUtil !== null && acct.limit && (
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Utilization</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>
                        {creditUtil}% · Limit {formatCurrency(acct.limit, currency, 0)}
                      </span>
                    </div>
                    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(creditUtil, 100)}%` }}
                        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: creditUtil > 80 ? 'var(--accent-red)' : creditUtil > 50 ? '#fb923c' : acct.color }}
                      />
                    </div>
                  </div>
                )}

                {/* Loan repayment progress bar */}
                {loanProgress !== null && acct.limit && (
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Repaid</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>
                        {loanProgress}% · {formatCurrency(acct.limit, currency, 0)} original
                      </span>
                    </div>
                    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${loanProgress}%` }}
                        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: acct.color }}
                      />
                    </div>
                  </div>
                )}

                {/* Recent transactions */}
                {recentTxns.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Recent</div>
                    {recentTxns.map(t => (
                      <div key={t.id} className="flex justify-between items-center py-1">
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }} className="truncate">{t.name}</span>
                        <span style={{ fontSize: 11, fontFamily: 'Geist Mono, monospace', color: t.amount > 0 ? 'var(--accent-green)' : 'var(--text-primary)', flexShrink: 0, marginLeft: 8 }}>
                          {t.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(t.amount), currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Overlay to close dropdown on outside click */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        />
      )}

      {/* Add/Edit Modal */}
      <AddAccountModal
        open={modalOpen}
        onClose={handleModalClose}
        editAccount={editAccount}
      />
    </AppShell>
  );
}
