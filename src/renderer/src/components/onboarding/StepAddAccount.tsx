import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, SkipForward,
  Wallet, PiggyBank, CreditCard, TrendingUp, Receipt, ChevronDown, Check,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import type { Account } from '@/context/FinanceContext';
import { SRI_LANKA_BANKS } from '@/utils/sriLankaBanks';

type AccountType = Account['type'];

const TYPE_OPTIONS: { value: AccountType; icon: React.ReactNode; label: string; description: string; color: string }[] = [
  { value: 'checking',   icon: <Wallet size={22} />,    label: 'Checking',        description: 'Debit / current account',   color: '#3b82f6' },
  { value: 'savings',    icon: <PiggyBank size={22} />, label: 'Savings',         description: 'Interest-bearing savings',  color: '#84cc16' },
  { value: 'credit',     icon: <CreditCard size={22} />,label: 'Credit Card',     description: 'Credit limit & balance',    color: '#f472b6' },
  { value: 'investment', icon: <TrendingUp size={22} />,label: 'Investment',      description: 'Brokerage / portfolio',     color: '#a78bfa' },
  { value: 'loan',       icon: <Receipt size={22} />,   label: 'Loan / Mortgage', description: 'Track debt repayment',      color: '#fb923c' },
];

const COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#facc15'];
const CARD_NETWORKS = ['visa', 'mastercard', 'amex'] as const;

const SUB_STEPS = ['Account Type', 'Bank & Details', 'Color'];

interface StepAddAccountProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

interface FormState {
  type: AccountType;
  bank: string; branch: string; name: string; balance: string; color: string;
  accountNumber: string; limit: string; cardNetwork: string;
  linkedAccountId: string; interestRate: string;
  loanMaturityDate: string; monthlyPayment: string; platform: string;
}

const DEFAULT_FORM: FormState = {
  type: 'checking', bank: '', branch: '', name: '', balance: '', color: COLORS[0],
  accountNumber: '', limit: '', cardNetwork: '', linkedAccountId: '',
  interestRate: '', loanMaturityDate: '', monthlyPayment: '', platform: '',
};

export default function StepAddAccount({ onNext, onSkip, onBack }: StepAddAccountProps) {
  const { addAccount, accounts } = useFinance();
  const [subStep, setSubStep] = useState(0);
  const [subDir, setSubDir] = useState(1);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  const selectedBank = SRI_LANKA_BANKS.find(b => b.name === form.bank);
  const branches = selectedBank?.branches ?? [];
  const selectedType = TYPE_OPTIONS.find(t => t.value === form.type)!;

  const goSub = (next: number) => { setSubDir(next > subStep ? 1 : -1); setSubStep(next); setError(''); };

  const handleTypeSelect = (type: AccountType) => {
    setForm(f => ({
      ...f, type,
      name: f.bank ? `${f.bank.split(' ')[0]} ${TYPE_OPTIONS.find(t => t.value === type)!.label}` : '',
    }));
    goSub(1);
  };

  const handleBankSelect = (bankName: string) => {
    setForm(f => ({
      ...f, bank: bankName, branch: '',
      name: bankName ? `${bankName.split(' ')[0]} ${selectedType.label}` : f.name,
    }));
  };

  const validateDetails = () => {
    if (!form.bank) { setError('Please select a bank.'); return false; }
    if (!form.name.trim()) { setError('Account name is required.'); return false; }
    if (form.balance === '') { setError('Please enter the current balance.'); return false; }
    return true;
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const balanceNum = parseFloat(form.balance) || 0;
      const finalBalance = (form.type === 'credit' || form.type === 'loan') ? -Math.abs(balanceNum) : balanceNum;
      addAccount({
        type: form.type, name: form.name.trim(), balance: finalBalance, color: form.color,
        bank: form.bank, branch: form.branch || undefined,
        accountNumber: form.accountNumber || undefined,
        limit: form.limit ? parseFloat(form.limit) : undefined,
        cardNetwork: form.cardNetwork ? (form.cardNetwork as Account['cardNetwork']) : undefined,
        linkedAccountId: form.linkedAccountId || undefined,
        interestRate: form.interestRate ? parseFloat(form.interestRate) : undefined,
        loanMaturityDate: form.loanMaturityDate || undefined,
        monthlyPayment: form.monthlyPayment ? parseFloat(form.monthlyPayment) : undefined,
      });
      onNext();
    } catch {
      setError('Failed to save account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none', cursor: 'pointer' };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Add your first account
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Connect a bank account or wallet to start tracking your balance.
        </p>
      </div>

      {/* Sub-step progress */}
      <div className="flex items-center gap-0">
        {SUB_STEPS.map((label, i) => {
          const done = subStep > i;
          const active = subStep === i;
          return (
            <div key={i} className="flex items-center" style={{ flex: i < SUB_STEPS.length - 1 ? 1 : undefined }}>
              <div className="flex items-center gap-2">
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: done ? 'var(--accent-brand)' : active ? 'rgba(132,204,22,0.15)' : 'var(--bg-secondary)',
                  border: done ? 'none' : active ? '2px solid var(--accent-brand)' : '2px solid var(--border)',
                  color: done ? 'white' : active ? 'var(--accent-brand)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}>
                  {done ? <Check size={13} strokeWidth={3} /> : i + 1}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text-primary)' : done ? 'var(--text-secondary)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}>
                  {label}
                </span>
              </div>
              {i < SUB_STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 1, margin: '0 10px',
                  background: done ? 'var(--accent-brand)' : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Animated sub-step content */}
      <div>
        <AnimatePresence mode="wait" custom={subDir}>
          <motion.div
            key={subStep}
            custom={subDir}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? -24 : 24, opacity: 0 }),
            }}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >

            {/* Sub-step 0: Type picker */}
            {subStep === 0 && (
              <div className="flex flex-col gap-3">
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                  What kind of account are you adding?
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {TYPE_OPTIONS.map(opt => {
                    const active = form.type === opt.value;
                    return (
                      <button key={opt.value} type="button" onClick={() => handleTypeSelect(opt.value)}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left"
                        style={{
                          border: active ? `1.5px solid ${opt.color}` : '1.5px solid var(--border)',
                          background: active ? `${opt.color}12` : 'var(--bg-secondary)',
                          cursor: 'pointer', width: '100%',
                        }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: `${opt.color}20`, border: `1px solid ${opt.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: opt.color,
                        }}>
                          {opt.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{opt.description}</div>
                        </div>
                        {active && (
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: opt.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Check size={11} color="white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-step 1: Bank & details */}
            {subStep === 1 && (
              <div className="flex flex-col gap-4">
                {/* Selected type badge */}
                <div className="flex items-center gap-2" style={{
                  padding: '8px 12px', borderRadius: 10, width: 'fit-content',
                  background: `${selectedType.color}15`, border: `1px solid ${selectedType.color}30`,
                }}>
                  <span style={{ color: selectedType.color }}>{selectedType.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: selectedType.color }}>{selectedType.label}</span>
                  <button type="button" onClick={() => goSub(0)}
                    style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: 4, textDecoration: 'underline' }}>
                    change
                  </button>
                </div>

                {/* Bank + Branch */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Bank</label>
                    <div style={{ position: 'relative' }}>
                      <select value={form.bank} onChange={e => handleBankSelect(e.target.value)} style={selectStyle}>
                        <option value="">Select bank...</option>
                        {SRI_LANKA_BANKS.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Branch</label>
                    <div style={{ position: 'relative' }}>
                      <select value={form.branch} onChange={e => set('branch', e.target.value)} disabled={!form.bank} style={{ ...selectStyle, opacity: !form.bank ? 0.5 : 1 }}>
                        <option value="">Select branch...</option>
                        {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                </div>

                {/* Name + Balance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Account Name</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder={`My ${selectedType.label}`} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      {form.type === 'investment' ? 'Current Value' : form.type === 'credit' || form.type === 'loan' ? 'Outstanding Balance' : 'Current Balance'} (LKR)
                    </label>
                    <input type="number" min="0" value={form.balance} onChange={e => set('balance', e.target.value)} placeholder="0.00" style={inputStyle} />
                  </div>
                </div>

                {/* Type-specific extras */}
                {form.type === 'checking' && (
                  <div>
                    <label style={labelStyle}>Account Number (optional)</label>
                    <input value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} placeholder="e.g. 1234 5678 9012" style={inputStyle} />
                  </div>
                )}
                {form.type === 'savings' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Account Number (optional)</label>
                      <input value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} placeholder="e.g. 1234 5678 9012" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Interest Rate % (optional)</label>
                      <input type="number" min="0" step="0.01" value={form.interestRate} onChange={e => set('interestRate', e.target.value)} placeholder="e.g. 6.5" style={inputStyle} />
                    </div>
                  </div>
                )}
                {form.type === 'credit' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={labelStyle}>Credit Limit (LKR)</label>
                        <input type="number" min="0" value={form.limit} onChange={e => set('limit', e.target.value)} placeholder="e.g. 500000" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Card Network</label>
                        <div style={{ position: 'relative' }}>
                          <select value={form.cardNetwork} onChange={e => set('cardNetwork', e.target.value)} style={selectStyle}>
                            <option value="">Select...</option>
                            {CARD_NETWORKS.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
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
                {form.type === 'investment' && (
                  <div>
                    <label style={labelStyle}>Platform / Broker</label>
                    <input value={form.platform} onChange={e => set('platform', e.target.value)} placeholder="e.g. CSE, ETF Platform, Fidelity" style={inputStyle} />
                  </div>
                )}
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

                {error && <p style={{ margin: 0, color: 'var(--accent-red)', fontSize: 13 }}>{error}</p>}
              </div>
            )}

            {/* Sub-step 2: Color */}
            {subStep === 2 && (
              <div className="flex flex-col gap-6">
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Pick a color to identify this account at a glance.
                </p>
                <div className="flex gap-4 flex-wrap" style={{ padding: '6px 8px' }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => set('color', c)}
                      className="transition-all"
                      style={{
                        width: 52, height: 52, borderRadius: 16, background: c,
                        border: 'none', cursor: 'pointer', flexShrink: 0,
                        transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                        outline: form.color === c ? `3px solid ${c}` : 'none',
                        outlineOffset: 4, transition: 'transform 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      {form.color === c && <Check size={20} color="white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'white' }}>{selectedType.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{form.name || `My ${selectedType.label}`}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{form.bank || 'No bank selected'} · {selectedType.label}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Geist Mono, monospace' }}>
                    LKR {parseFloat(form.balance || '0').toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {error && <p style={{ margin: 0, color: 'var(--accent-red)', fontSize: 13 }}>{error}</p>}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3 mt-1">
        <button type="button"
          onClick={() => subStep === 0 ? onBack() : goSub(subStep - 1)}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5"
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <ArrowLeft size={15} /> Back
        </button>
        <button type="button" onClick={onSkip}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5"
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <SkipForward size={15} /> Skip for now
        </button>
        {subStep < 2 ? (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => {
              if (subStep === 0) { goSub(1); return; }
              if (subStep === 1 && validateDetails()) goSub(2);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold"
            style={{ background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))', color: 'white', fontSize: 13, border: 'none', cursor: 'pointer' }}>
            Next <ArrowRight size={15} />
          </motion.button>
        ) : (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="button" disabled={saving}
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold"
            style={{ background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))', color: 'white', fontSize: 13, opacity: saving ? 0.7 : 1, border: 'none', cursor: 'pointer' }}>
            {saving ? 'Saving…' : <><span>Add Account</span><ArrowRight size={15} /></>}
          </motion.button>
        )}
      </div>
    </div>
  );
}
