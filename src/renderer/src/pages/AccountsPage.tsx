import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, CreditCard, TrendingUp, PiggyBank, Receipt,
  Plus, MoreHorizontal, Pencil, Trash2,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import type { Account } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatCurrency';
import AddAccountModal from '@/components/modals/AddAccountModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Shift each RGB channel of a hex colour by `amount` (negative = darken). */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Format a masked card number. Shows last 4 digits of accountNumber if present. */
function maskedNumber(accountNumber?: string): string {
  if (accountNumber) {
    const digits = accountNumber.replace(/\D/g, '');
    const last4 = digits.slice(-4).padEnd(4, '•');
    return `•••• •••• •••• ${last4}`;
  }
  return '•••• •••• •••• ••••';
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** EMV chip SVG — stylised gold chip icon. */
function ChipSVG() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="35" height="27" rx="4.5" fill="#D4A84B" fillOpacity="0.3" stroke="#D4A84B" strokeOpacity="0.6"/>
      <rect x="0.5" y="8.5"  width="35" height="4"  fill="#D4A84B" fillOpacity="0.45"/>
      <rect x="0.5" y="15.5" width="35" height="4"  fill="#D4A84B" fillOpacity="0.45"/>
      <rect x="11.5" y="0.5" width="4" height="27" fill="#D4A84B" fillOpacity="0.45"/>
      <rect x="20.5" y="0.5" width="4" height="27" fill="#D4A84B" fillOpacity="0.45"/>
      <rect x="11.5" y="8.5" width="13" height="11" rx="1" fill="#D4A84B" fillOpacity="0.7"/>
    </svg>
  );
}

// ── Static maps ───────────────────────────────────────────────────────────────

const TYPE_ICON: Record<Account['type'], React.ReactNode> = {
  checking:   <Wallet size={22} color="rgba(255,255,255,0.9)" />,
  savings:    <PiggyBank size={22} color="rgba(255,255,255,0.9)" />,
  credit:     <CreditCard size={22} color="rgba(255,255,255,0.9)" />,
  investment: <TrendingUp size={22} color="rgba(255,255,255,0.9)" />,
  loan:       <Receipt size={22} color="rgba(255,255,255,0.9)" />,
};

const TYPE_BALANCE_LABEL: Record<Account['type'], string> = {
  checking:   'Current Balance',
  savings:    'Current Balance',
  credit:     'Outstanding',
  investment: 'Portfolio Value',
  loan:       'Outstanding',
};

const TYPE_LABEL: Record<Account['type'], string> = {
  checking:   'Checking',
  savings:    'Savings',
  credit:     'Credit Card',
  investment: 'Investment',
  loan:       'Loan / Mortgage',
};

const NETWORK_BADGE: Record<string, React.ReactNode> = {
  visa: (
    <span style={{ fontFamily: 'serif', fontSize: 15, fontWeight: 800, fontStyle: 'italic', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>
      VISA
    </span>
  ),
  mastercard: (
    <span style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(235,0,27,0.85)', display: 'inline-block', marginRight: -6 }} />
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,163,0,0.85)', display: 'inline-block' }} />
    </span>
  ),
  amex: (
    <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em' }}>
      AMEX
    </span>
  ),
};

// ── Main component ────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const { accounts, transactions, currency, deleteAccount } = useFinance();
  const { user } = useAuth();

  const [modalOpen, setModalOpen]           = useState(false);
  const [editAccount, setEditAccount]       = useState<Account | undefined>(undefined);
  const [menuOpen, setMenuOpen]             = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm]   = useState<string | null>(null);

  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalDebt   = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);

  const handleEdit          = (acct: Account) => { setEditAccount(acct); setMenuOpen(null); setModalOpen(true); };
  const handleDeleteConfirm = (id: string)    => { setDeleteConfirm(null); setMenuOpen(null); deleteAccount(id); };
  const handleAddClick      = ()              => { setEditAccount(undefined); setModalOpen(true); };
  const handleModalClose    = ()              => { setModalOpen(false); setEditAccount(undefined); };

  // Cardholder display name — abbreviate if long
  const cardholderName = (() => {
    const name = user?.name ?? 'Account Holder';
    if (name.length <= 20) return name;
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : name.slice(0, 20);
  })();

  return (
    <AppShell>
      {/* ── Stat row ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        {[
          { label: 'Total Assets', value: formatCurrency(totalAssets, currency), color: 'var(--accent-green)' },
          { label: 'Total Debt',   value: formatCurrency(totalDebt,   currency), color: 'var(--accent-red)'   },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }} className="card p-4 flex-1">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>{s.value}</div>
          </motion.div>
        ))}
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          onClick={handleAddClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 10, border: 'none',
            background: 'var(--accent-brand)', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap', alignSelf: 'center',
          }}
        >
          <Plus size={16} /> Add Account
        </motion.button>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {accounts.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center"
          style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div className="card flex items-center justify-center"
            style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 16, color: 'var(--text-muted)' }}>
            <Wallet size={28} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No accounts yet</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 320 }}>
            Add your bank accounts to track balances, credit cards, loans, and investments in one place.
          </div>
          <button onClick={handleAddClick} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
            border: 'none', background: 'var(--accent-brand)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={16} /> Add Your First Account
          </button>
        </motion.div>
      )}

      {/* ── Accounts grid ────────────────────────────────────────────────── */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-2 gap-5">
          {accounts.map((acct, i) => {
            const recentTxns      = transactions.filter(t => t.account === acct.name).slice(0, 3);
            const isMenuOpen      = menuOpen === acct.id;
            const isDeleteConfirm = deleteConfirm === acct.id;

            const loanProgress = acct.type === 'loan' && acct.limit
              ? Math.max(0, Math.min(100, Math.round(((acct.limit - Math.abs(acct.balance)) / acct.limit) * 100)))
              : null;
            const creditUtil = acct.type === 'credit' && acct.limit
              ? Math.round((Math.abs(acct.balance) / acct.limit) * 100)
              : null;

            const gradFrom     = adjustColor(acct.color, -60);
            const gradTo       = adjustColor(acct.color, 30);
            const cardGradient = `linear-gradient(135deg, ${gradFrom} 0%, ${acct.color} 55%, ${gradTo} 100%)`;

            const hasProgress = creditUtil !== null || loanProgress !== null;

            return (
              <motion.div key={acct.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card overflow-hidden"
                style={{ position: 'relative', padding: 0 }}
              >
                {/* ⋯ menu trigger — floats above card gradient */}
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                  <button
                    onClick={() => setMenuOpen(isMenuOpen ? null : acct.id)}
                    style={{
                      background: 'rgba(0,0,0,0.30)', border: 'none', cursor: 'pointer',
                      color: '#fff', padding: '4px 6px', borderRadius: 8,
                      display: 'flex', alignItems: 'center', backdropFilter: 'blur(4px)',
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
                          position: 'absolute', top: 32, right: 0, zIndex: 50,
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 10, padding: '4px', minWidth: 130,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                        }}
                      >
                        <button onClick={() => handleEdit(acct)} style={{
                          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                          padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer',
                          borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
                        }}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button onClick={() => { setDeleteConfirm(acct.id); setMenuOpen(null); }} style={{
                          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                          padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer',
                          borderRadius: 6, color: 'var(--accent-red)', fontSize: 13,
                        }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Physical card face ──────────────────────────────────── */}
                <div style={{
                  background: cardGradient,
                  padding: '20px 20px 18px',
                  display: 'flex', flexDirection: 'column', gap: 14,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Decorative circle glows */}
                  <div style={{
                    position: 'absolute', width: 140, height: 140, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.07)', top: -40, right: -30, pointerEvents: 'none',
                  }} />
                  <div style={{
                    position: 'absolute', width: 90, height: 90, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)', bottom: 10, left: -25, pointerEvents: 'none',
                  }} />

                  {/* Row 1: chip + type icon */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ChipSVG />
                    <div style={{ opacity: 0.85 }}>{TYPE_ICON[acct.type]}</div>
                  </div>

                  {/* Row 2: balance */}
                  <div>
                    <div style={{
                      fontSize: 22, fontWeight: 700, color: '#fff',
                      fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.01em', lineHeight: 1.2,
                    }}>
                      {formatCurrency(Math.abs(acct.balance), currency)}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2, letterSpacing: '0.03em' }}>
                      {TYPE_BALANCE_LABEL[acct.type]}
                    </div>
                  </div>

                  {/* Row 3: cardholder + valid thru + bank */}
                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
                        {acct.type === 'loan' ? 'Borrower' : acct.type === 'investment' ? 'Investor' : 'Account Holder'}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '0.03em' }}>
                        {cardholderName}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
                        {acct.type === 'credit' ? 'Valid Thru' : 'Since'}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                        {acct.type === 'credit' ? '••/••' : new Date().getFullYear().toString()}
                      </div>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textAlign: 'right', maxWidth: 90, lineHeight: 1.3 }}>
                      {acct.bank ? acct.bank.split(' ').slice(0, 2).join(' ') : TYPE_LABEL[acct.type]}
                    </div>
                  </div>

                  {/* Row 4: masked number + network badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      fontSize: 12, fontFamily: 'Geist Mono, monospace', color: 'rgba(255,255,255,0.8)',
                      letterSpacing: '0.12em', fontWeight: 500,
                    }}>
                      {maskedNumber(acct.accountNumber)}
                    </div>
                    <div>
                      {acct.cardNetwork && NETWORK_BADGE[acct.cardNetwork]
                        ? NETWORK_BADGE[acct.cardNetwork]
                        : <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>
                            {TYPE_LABEL[acct.type].slice(0, 3).toUpperCase()}
                          </span>
                      }
                    </div>
                  </div>
                </div>

                {/* ── Info section (below card face) ──────────────────────── */}
                <div style={{ padding: '12px 16px 14px' }}>

                  {/* Delete confirmation banner */}
                  <AnimatePresence>
                    {isDeleteConfirm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 8, padding: '10px 12px', marginBottom: 10, overflow: 'hidden',
                        }}
                      >
                        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-secondary)' }}>
                          Delete this account? Linked transactions will remain.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => setDeleteConfirm(null)} style={{
                            fontSize: 12, padding: '4px 10px', borderRadius: 6,
                            border: '1px solid var(--border)', background: 'none',
                            cursor: 'pointer', color: 'var(--text-secondary)',
                          }}>Cancel</button>
                          <button onClick={() => handleDeleteConfirm(acct.id)} style={{
                            fontSize: 12, padding: '4px 10px', borderRadius: 6, border: 'none',
                            background: 'var(--accent-red)', cursor: 'pointer', color: '#fff', fontWeight: 600,
                          }}>Delete</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Credit utilization bar */}
                  {creditUtil !== null && acct.limit && (
                    <div style={{ marginBottom: 10 }}>
                      <div className="flex justify-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Credit utilization</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>
                          {creditUtil}% · {formatCurrency(acct.limit, currency, 0)} limit
                        </span>
                      </div>
                      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${Math.min(creditUtil, 100)}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ background: creditUtil > 80 ? 'var(--accent-red)' : creditUtil > 50 ? '#fb923c' : acct.color }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Loan repayment bar */}
                  {loanProgress !== null && acct.limit && (
                    <div style={{ marginBottom: 10 }}>
                      <div className="flex justify-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Repaid</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>
                          {loanProgress}% · {formatCurrency(acct.limit, currency, 0)} original
                        </span>
                      </div>
                      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${loanProgress}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ background: acct.color }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Recent transactions */}
                  {recentTxns.length > 0 ? (
                    <div style={{ borderTop: hasProgress ? '1px solid var(--border)' : 'none', paddingTop: hasProgress ? 10 : 0 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Recent</div>
                      {recentTxns.map(t => (
                        <div key={t.id} className="flex justify-between items-center py-0.5">
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }} className="truncate">{t.name}</span>
                          <span style={{
                            fontSize: 11, fontFamily: 'Geist Mono, monospace', flexShrink: 0, marginLeft: 8,
                            color: t.amount > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                          }}>
                            {t.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(t.amount), currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>
                      No recent transactions
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Overlay to close dropdown on outside click */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      )}

      {/* Add / Edit Modal */}
      <AddAccountModal open={modalOpen} onClose={handleModalClose} editAccount={editAccount} />
    </AppShell>
  );
}
