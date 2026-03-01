import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Wallet, PiggyBank, CreditCard, TrendingUp, Receipt, X, ChevronDown } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import type { Account } from '@/context/FinanceContext';
import { SRI_LANKA_BANKS } from '@/utils/sriLankaBanks';

type AccountType = Account['type'];

const TYPE_CONFIG: Record<AccountType, { icon: React.ReactNode; label: string; description: string }> = {
  checking:   { icon: <Wallet size={18} />,    label: 'Checking',        description: 'Debit / current account' },
  savings:    { icon: <PiggyBank size={18} />, label: 'Savings',         description: 'Interest-bearing savings' },
  credit:     { icon: <CreditCard size={18} />,label: 'Credit Card',     description: 'Credit limit & balance' },
  investment: { icon: <TrendingUp size={18} />,label: 'Investment',      description: 'Brokerage / portfolio' },
  loan:       { icon: <Receipt size={18} />,   label: 'Loan / Mortgage', description: 'Track debt repayment' },
};

const COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#facc15'];

const CARD_NETWORKS = ['visa', 'mastercard', 'amex'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  editAccount?: Account;
}

interface FormState {
  type: AccountType;
  bank: string;
  branch: string;
  name: string;
  balance: string;
  color: string;
  accountNumber: string;
  limit: string;
  cardNetwork: string;
  linkedAccountId: string;
  interestRate: string;
  loanMaturityDate: string;
  monthlyPayment: string;
  platform: string;
}

const DEFAULT_FORM: FormState = {
  type: 'checking',
  bank: '',
  branch: '',
  name: '',
  balance: '',
  color: COLORS[0],
  accountNumber: '',
  limit: '',
  cardNetwork: '',
  linkedAccountId: '',
  interestRate: '',
  loanMaturityDate: '',
  monthlyPayment: '',
  platform: '',
};

export default function AddAccountModal({ open, onClose, editAccount }: Props) {
  const { addAccount, updateAccount, accounts } = useFinance();

  const [form, setForm] = useState<FormState>(() =>
    editAccount
      ? {
          type: editAccount.type,
          bank: editAccount.bank ?? '',
          branch: editAccount.branch ?? '',
          name: editAccount.name,
          balance: String(Math.abs(editAccount.balance)),
          color: editAccount.color,
          accountNumber: editAccount.accountNumber ?? '',
          limit: editAccount.limit ? String(editAccount.limit) : '',
          cardNetwork: editAccount.cardNetwork ?? '',
          linkedAccountId: editAccount.linkedAccountId ?? '',
          interestRate: editAccount.interestRate ? String(editAccount.interestRate) : '',
          loanMaturityDate: editAccount.loanMaturityDate ?? '',
          monthlyPayment: editAccount.monthlyPayment ? String(editAccount.monthlyPayment) : '',
          platform: '',
        }
      : DEFAULT_FORM
  );

  const [error, setError] = useState('');
  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedBank = SRI_LANKA_BANKS.find(b => b.name === form.bank);
  const branches = selectedBank?.branches ?? [];

  const handleBankSelect = (bankName: string) => {
    setForm(f => ({
      ...f,
      bank: bankName,
      branch: '',
      name: bankName ? `${bankName.split(' ')[0]} ${TYPE_CONFIG[f.type].label}` : f.name,
    }));
  };

  const handleTypeChange = (type: AccountType) => {
    setForm(f => ({
      ...f,
      type,
      name: f.bank ? `${f.bank.split(' ')[0]} ${TYPE_CONFIG[type].label}` : f.name,
    }));
  };

  const handleClose = () => {
    setForm(DEFAULT_FORM);
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    if (!form.bank) { setError('Please select a bank.'); return; }
    if (!form.name.trim()) { setError('Account name is required.'); return; }
    if (form.balance === '') { setError('Please enter the current balance.'); return; }

    const balanceNum = parseFloat(form.balance) || 0;
    const finalBalance = (form.type === 'credit' || form.type === 'loan')
      ? -Math.abs(balanceNum)
      : balanceNum;

    const accountData: Omit<Account, 'id'> = {
      type: form.type,
      name: form.name.trim(),
      balance: finalBalance,
      color: form.color,
      bank: form.bank,
      branch: form.branch || undefined,
      accountNumber: form.accountNumber || undefined,
      limit: form.limit ? parseFloat(form.limit) : undefined,
      cardNetwork: form.cardNetwork ? (form.cardNetwork as Account['cardNetwork']) : undefined,
      linkedAccountId: form.linkedAccountId || undefined,
      interestRate: form.interestRate ? parseFloat(form.interestRate) : undefined,
      loanMaturityDate: form.loanMaturityDate || undefined,
      monthlyPayment: form.monthlyPayment ? parseFloat(form.monthlyPayment) : undefined,
    };

    if (editAccount) {
      updateAccount(editAccount.id, accountData);
    } else {
      addAccount(accountData);
    }

    setForm(DEFAULT_FORM);
    setError('');
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    cursor: 'pointer',
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 999,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
          <div style={{
              width: 760,
              maxHeight: '85vh',
              background: 'var(--bg-card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              pointerEvents: 'auto',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {editAccount ? 'Edit Account' : 'Add New Account'}
              </h2>
              <button
                onClick={handleClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body: split pane */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

              {/* Left sidebar: type picker */}
              <div style={{
                width: 190,
                borderRight: '1px solid var(--border)',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                flexShrink: 0,
                overflowY: 'auto',
              }}>
                {(Object.entries(TYPE_CONFIG) as [AccountType, typeof TYPE_CONFIG[AccountType]][]).map(([type, cfg]) => {
                  const active = form.type === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeChange(type)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 10px 10px 12px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                        borderLeft: active ? '3px solid var(--accent-brand)' : '3px solid transparent',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        width: '100%',
                      }}
                    >
                      <span style={{ color: active ? 'var(--accent-brand)' : 'var(--text-muted)', marginTop: 2, flexShrink: 0 }}>
                        {cfg.icon}
                      </span>
                      <span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {cfg.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {cfg.description}
                        </div>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right form panel */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Bank + Branch */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Bank</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={form.bank}
                        onChange={e => handleBankSelect(e.target.value)}
                        style={selectStyle}
                      >
                        <option value="">Select bank...</option>
                        {SRI_LANKA_BANKS.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Branch</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={form.branch}
                        onChange={e => set('branch', e.target.value)}
                        disabled={!form.bank}
                        style={{ ...selectStyle, opacity: !form.bank ? 0.5 : 1 }}
                      >
                        <option value="">Select branch...</option>
                        {branches.map(b => (
                          <option key={b.name} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                </div>

                {/* Account name + balance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Account Name</label>
                    <input
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder={`My ${TYPE_CONFIG[form.type].label}`}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      {form.type === 'investment' ? 'Current Value' : form.type === 'credit' || form.type === 'loan' ? 'Outstanding Balance' : 'Current Balance'} (LKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.balance}
                      onChange={e => set('balance', e.target.value)}
                      placeholder="0.00"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Checking: account number */}
                {form.type === 'checking' && (
                  <div>
                    <label style={labelStyle}>Account Number (optional)</label>
                    <input
                      value={form.accountNumber}
                      onChange={e => set('accountNumber', e.target.value)}
                      placeholder="e.g. 1234 5678 9012"
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* Savings: account number + interest rate */}
                {form.type === 'savings' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Account Number (optional)</label>
                      <input
                        value={form.accountNumber}
                        onChange={e => set('accountNumber', e.target.value)}
                        placeholder="e.g. 1234 5678 9012"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Interest Rate % (optional)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.interestRate}
                        onChange={e => set('interestRate', e.target.value)}
                        placeholder="e.g. 6.5"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}

                {/* Credit card */}
                {form.type === 'credit' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={labelStyle}>Credit Limit (LKR)</label>
                        <input
                          type="number"
                          min="0"
                          value={form.limit}
                          onChange={e => set('limit', e.target.value)}
                          placeholder="e.g. 500000"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Card Network</label>
                        <div style={{ position: 'relative' }}>
                          <select value={form.cardNetwork} onChange={e => set('cardNetwork', e.target.value)} style={selectStyle}>
                            <option value="">Select...</option>
                            {CARD_NETWORKS.map(n => (
                              <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={labelStyle}>Card Number / Last 4 (optional)</label>
                        <input value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} placeholder="e.g. **** 4321" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Link to Bank Account (optional)</label>
                        <div style={{ position: 'relative' }}>
                          <select value={form.linkedAccountId} onChange={e => set('linkedAccountId', e.target.value)} style={selectStyle}>
                            <option value="">None</option>
                            {accounts.filter(a => a.type === 'checking' || a.type === 'savings').map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Investment */}
                {form.type === 'investment' && (
                  <div>
                    <label style={labelStyle}>Platform / Broker</label>
                    <input value={form.platform} onChange={e => set('platform', e.target.value)} placeholder="e.g. CSE, ETF Platform, Fidelity" style={inputStyle} />
                  </div>
                )}

                {/* Loan */}
                {form.type === 'loan' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={labelStyle}>Original Loan Amount (LKR)</label>
                        <input type="number" min="0" value={form.limit} onChange={e => set('limit', e.target.value)} placeholder="e.g. 5000000" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Monthly Payment (LKR)</label>
                        <input type="number" min="0" value={form.monthlyPayment} onChange={e => set('monthlyPayment', e.target.value)} placeholder="e.g. 45000" style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={labelStyle}>Interest Rate % (optional)</label>
                        <input type="number" min="0" step="0.01" value={form.interestRate} onChange={e => set('interestRate', e.target.value)} placeholder="e.g. 12.5" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Maturity Date (optional)</label>
                        <input type="date" value={form.loanMaturityDate} onChange={e => set('loanMaturityDate', e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </>
                )}

                {/* Color picker */}
                <div>
                  <label style={labelStyle}>Color</label>
                  <div style={{ display: 'flex', gap: 12, padding: '4px 2px' }}>
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => set('color', c)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: c, border: 'none', cursor: 'pointer',
                          transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                          outline: form.color === c ? `2px solid ${c}` : 'none',
                          outlineOffset: 3,
                          transition: 'transform 0.15s',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p style={{ margin: 0, color: 'var(--accent-red)', fontSize: 13 }}>{error}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10,
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <button
                onClick={handleClose}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-secondary)', fontSize: 14,
                  cursor: 'pointer', fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: 'var(--accent-brand)', color: '#fff', fontSize: 14,
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                {editAccount ? 'Save Changes' : 'Add Account'}
              </button>
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
