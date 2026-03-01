import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, CreditCard, TrendingUp, PiggyBank, Receipt,
  Plus, MoreHorizontal, Pencil, Trash2, SlidersHorizontal,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import type { Account } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/formatCurrency';
import AddAccountModal from '@/components/modals/AddAccountModal';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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

type FilterType = 'all' | Account['type'];

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'checking',   label: 'Checking' },
  { key: 'savings',    label: 'Savings' },
  { key: 'credit',     label: 'Credit' },
  { key: 'investment', label: 'Investment' },
  { key: 'loan',       label: 'Loan' },
];

export default function AccountsPage() {
  const { accounts, transactions, currency, deleteAccount } = useFinance();
  const { user } = useAuth();

  const [modalOpen, setModalOpen]           = useState(false);
  const [editAccount, setEditAccount]       = useState<Account | undefined>(undefined);
  const [menuOpen, setMenuOpen]             = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm]   = useState<string | null>(null);
  const [activeFilter, setActiveFilter]     = useState<FilterType>('all');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const totalAssets  = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalDebt    = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);
  const netWorthDisp = totalAssets - totalDebt;

  // Build monthly cumulative balance chart data from transactions
  const balanceChartData = useMemo(() => {
    if (transactions.length === 0) return [];
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const monthMap: Record<string, number> = {};
    for (const t of sorted) {
      const month = t.date.slice(0, 7); // "YYYY-MM"
      monthMap[month] = (monthMap[month] || 0) + t.amount;
    }
    // Build cumulative running total
    const months = Object.keys(monthMap).sort();
    let running = 0;
    return months.map(m => {
      running += monthMap[m];
      const [y, mo] = m.split('-').map(Number);
      const label = new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return { month: label, value: Math.round(running) };
    });
  }, [transactions]);

  const visibleAccounts = useMemo(() =>
    activeFilter === 'all' ? accounts : accounts.filter(a => a.type === activeFilter),
    [accounts, activeFilter]
  );

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
    <>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20 }}>

        {/* Top row: title + Add button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Accounts</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
            </p>
          </div>
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 10, border: 'none',
              background: 'var(--accent-brand)', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <Plus size={15} /> Add Account
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Total Assets',  value: formatCurrency(totalAssets,  currency), color: 'var(--accent-green)', sub: `${accounts.filter(a => a.balance > 0).length} accounts` },
            { label: 'Total Debt',    value: formatCurrency(totalDebt,    currency), color: 'var(--accent-red)',   sub: `${accounts.filter(a => a.balance < 0).length} accounts` },
            { label: 'Net Worth',     value: formatCurrency(netWorthDisp, currency), color: netWorthDisp >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', sub: 'assets − debt' },
            { label: 'Accounts',      value: String(accounts.length),                color: 'var(--text-primary)', sub: `${FILTER_OPTIONS.slice(1).filter(f => accounts.some(a => a.type === f.key)).length} types` },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em', marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Balance over time chart */}
        {balanceChartData.length > 1 && (
          <div className="card" style={{ padding: '16px 20px 12px', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              Portfolio Value Over Time
            </div>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Geist Mono, monospace' }}
                    interval="preserveStartEnd" />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v, currency, 0), 'Balance']}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-muted)' }}
                    cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2}
                    fill="url(#balGrad)" dot={false}
                    activeDot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filter pills + icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTER_OPTIONS.map(f => {
              const count = f.key === 'all' ? accounts.length : accounts.filter(a => a.type === f.key).length;
              const active = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 20, border: '1px solid',
                    borderColor: active ? 'var(--accent-brand)' : 'var(--border)',
                    background: active ? 'var(--accent-brand)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                  {count > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: active ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                      color: active ? '#fff' : 'var(--text-muted)',
                      borderRadius: 10, padding: '1px 5px', lineHeight: 1.5,
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

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

      {/* ── Filtered empty ────────────────────────────────────────────────── */}
      {accounts.length > 0 && visibleAccounts.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            No {activeFilter} accounts yet.{' '}
            <button onClick={() => setActiveFilter('all')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-brand)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Show all
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Accounts grid ────────────────────────────────────────────────── */}
      {visibleAccounts.length > 0 && (
        <div className="grid grid-cols-2 gap-5">
          {visibleAccounts.map((acct, i) => {
            const acctTxns        = transactions.filter(t => t.account === acct.name);
            const recentTxns      = acctTxns.slice(0, 3);
            const hasTxns         = acctTxns.length > 0;
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
                <div ref={isMenuOpen ? menuRef : undefined} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
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
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(acct); }} style={{
                          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                          padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer',
                          borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
                        }}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (!hasTxns) { setDeleteConfirm(acct.id); setMenuOpen(null); } }}
                          disabled={hasTxns}
                          title={hasTxns ? `Cannot delete — ${acctTxns.length} transaction${acctTxns.length !== 1 ? 's' : ''} linked` : undefined}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '8px 12px', background: 'none', border: 'none',
                            cursor: hasTxns ? 'not-allowed' : 'pointer',
                            borderRadius: 6,
                            color: hasTxns ? 'var(--text-muted)' : 'var(--accent-red)',
                            fontSize: 13, opacity: hasTxns ? 0.5 : 1,
                          }}
                        >
                          <Trash2 size={14} />
                          <span style={{ flex: 1 }}>Delete</span>
                          {hasTxns && (
                            <span style={{
                              fontSize: 10, fontWeight: 600,
                              background: 'var(--border)', color: 'var(--text-muted)',
                              borderRadius: 6, padding: '1px 5px',
                            }}>{acctTxns.length} txn{acctTxns.length !== 1 ? 's' : ''}</span>
                          )}
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

                  {/* Delete confirmation / blocked banner */}
                  <AnimatePresence>
                    {isDeleteConfirm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                          background: hasTxns ? 'rgba(251,146,60,0.08)' : 'rgba(239,68,68,0.08)',
                          border: `1px solid ${hasTxns ? 'rgba(251,146,60,0.35)' : 'rgba(239,68,68,0.3)'}`,
                          borderRadius: 8, padding: '10px 12px', marginBottom: 10, overflow: 'hidden',
                        }}
                      >
                        {hasTxns ? (
                          <>
                            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                              Cannot delete — this account has {acctTxns.length} linked transaction{acctTxns.length !== 1 ? 's' : ''}.
                            </p>
                            <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--text-muted)' }}>
                              Remove or reassign all transactions before deleting this account.
                            </p>
                            <button onClick={() => setDeleteConfirm(null)} style={{
                              fontSize: 12, padding: '4px 10px', borderRadius: 6,
                              border: '1px solid var(--border)', background: 'none',
                              cursor: 'pointer', color: 'var(--text-secondary)',
                            }}>Got it</button>
                          </>
                        ) : (
                          <>
                            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-secondary)' }}>
                              Permanently delete this account?
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
                          </>
                        )}
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

      {/* Add / Edit Modal */}
      <AddAccountModal open={modalOpen} onClose={handleModalClose} editAccount={editAccount} />
    </>
  );
}
