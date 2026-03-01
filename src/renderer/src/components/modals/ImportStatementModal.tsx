// src/renderer/src/components/modals/ImportStatementModal.tsx
import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Upload, ChevronRight, CheckCircle2, AlertCircle,
  FileSpreadsheet, Loader2, ChevronDown,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import type { TransactionCategory } from '@/context/FinanceContext';
import { parseStatement, parsedRowsToTransactions } from '@/utils/statementParsers';
import type { ParsedRow, ParseResult } from '@/utils/statementParsers';
import { formatCurrency } from '@/utils/formatCurrency';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['Select Account', 'Upload File', 'Preview & Import'] as const;

const CATEGORIES: TransactionCategory[] = [
  'Salary', 'Freelance', 'Investment', 'Refund',
  'Groceries', 'Dining', 'Transport', 'Utilities',
  'Rent', 'Gym', 'Internet', 'Spotify', 'Netflix',
  'Shopping', 'Health', 'Other',
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImportStatementModal({ open, onClose }: Props) {
  const { accounts, addTransactions, currency } = useFinance();

  const [step, setStep] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [fileName, setFileName] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [categoryOverrides, setCategoryOverrides] = useState<Record<number, TransactionCategory>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imported, setImported] = useState(false);

  // Only bank-linked checking/savings/credit accounts can receive imports
  const eligibleAccounts = useMemo(
    () => accounts.filter(
      a => a.bank && (a.type === 'checking' || a.type === 'savings' || a.type === 'credit')
    ),
    [accounts]
  );

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const resetAndClose = () => {
    setStep(0);
    setSelectedAccountId('');
    setFileName('');
    setParseResult(null);
    setRows([]);
    setCategoryOverrides({});
    setError('');
    setImported(false);
    onClose();
  };

  // ── Step 0: account selection ──────────────────────────────────────────────

  const handleNext0 = () => {
    if (!selectedAccountId) { setError('Please select an account.'); return; }
    setError('');
    setStep(1);
  };

  // ── Step 1: file picker ────────────────────────────────────────────────────

  const handlePickFile = async () => {
    setError('');
    try {
      const filePath = await window.electron?.dialog.openFile([
        { name: 'Bank Statements', extensions: ['xlsx', 'xls'] },
      ]);
      if (!filePath) return; // user cancelled

      const name = filePath.split('/').pop() ?? filePath;
      setFileName(name);
      setLoading(true);

      const base64 = await window.electron?.dialog.readFile(filePath);
      if (!base64) throw new Error('Could not read file.');

      const result = parseStatement(base64, name);
      setParseResult(result);
      setRows(result.rows);
      setCategoryOverrides({});
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to parse file.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: preview & import ───────────────────────────────────────────────

  const effectiveCategory = (i: number): TransactionCategory =>
    categoryOverrides[i] ?? rows[i].category;

  const handleImport = () => {
    if (!selectedAccount) return;
    const txns = parsedRowsToTransactions(
      rows.map((r, i) => ({ ...r, category: effectiveCategory(i) })),
      selectedAccount.name,
    );
    addTransactions(txns);
    setImported(true);
  };

  const incomeTotal  = rows.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const expenseTotal = rows.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);

  // ─── Render ────────────────────────────────────────────────────────────────

  return createPortal(
    <AnimatePresence>
      {open && (
        // Full-screen flex centering wrapper — avoids Framer Motion transform conflict
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={resetAndClose}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              pointerEvents: 'auto',
            }}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative', zIndex: 1, pointerEvents: 'auto',
              width: step === 2 ? 860 : 540,
              maxHeight: '88vh',
              background: 'var(--bg-card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              transition: 'width 0.3s ease',
            }}
          >
            {/* ── Header ───────────────────────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Import Bank Statement
                </h2>
                {parseResult && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {parseResult.detectedFormat} · {rows.length} transactions detected
                  </div>
                )}
              </div>
              <button
                onClick={resetAndClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* ── Step indicator ───────────────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '14px 24px', gap: 0,
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-primary)',
            }}>
              {STEPS.map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: i <= step ? 'var(--accent-brand)' : 'var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      color: i <= step ? '#fff' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}>
                      {i < step ? <CheckCircle2 size={13} /> : i + 1}
                    </div>
                    <span style={{
                      fontSize: 13,
                      fontWeight: i === step ? 600 : 400,
                      color: i === step ? 'var(--text-primary)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 12px' }} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Body ─────────────────────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

              {/* Step 0: Select account */}
              {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Select the bank account that matches your statement. Only checking, savings, and credit accounts linked to a bank are shown.
                  </p>

                  {eligibleAccounts.length === 0 ? (
                    <div style={{
                      padding: '24px', borderRadius: 10, textAlign: 'center',
                      border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: 14,
                    }}>
                      No eligible accounts found. Please add a checking, savings, or credit account with a bank selected first on the Accounts page.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {eligibleAccounts.map(acct => {
                        const selected = selectedAccountId === acct.id;
                        return (
                          <button
                            key={acct.id}
                            onClick={() => { setSelectedAccountId(acct.id); setError(''); }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 14,
                              padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                              border: selected ? '2px solid var(--accent-brand)' : '1px solid var(--border)',
                              background: selected ? 'rgba(99,102,241,0.08)' : 'var(--bg-primary)',
                              textAlign: 'left', transition: 'all 0.15s',
                            }}
                          >
                            <div style={{
                              width: 36, height: 36, borderRadius: 8,
                              background: `${acct.color}22`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <div style={{ width: 12, height: 12, borderRadius: '50%', background: acct.color }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{acct.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                {acct.bank}{acct.branch ? ` · ${acct.branch}` : ''}
                              </div>
                            </div>
                            {selected && <CheckCircle2 size={18} color="var(--accent-brand)" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {error && (
                    <span style={{ fontSize: 13, color: 'var(--accent-red)' }}>{error}</span>
                  )}
                </div>
              )}

              {/* Step 1: Upload file */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', paddingTop: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Importing into: <strong style={{ color: 'var(--text-primary)' }}>{selectedAccount?.name}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {selectedAccount?.bank}{selectedAccount?.branch ? ` · ${selectedAccount.branch}` : ''}
                    </div>
                  </div>

                  <button
                    onClick={handlePickFile}
                    disabled={loading}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                      padding: '40px 48px', borderRadius: 14, cursor: loading ? 'wait' : 'pointer',
                      border: '2px dashed var(--border)', background: 'var(--bg-primary)',
                      color: 'var(--text-secondary)', transition: 'all 0.2s', width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {loading
                      ? <Loader2 size={32} style={{ color: 'var(--accent-brand)', animation: 'spin 1s linear infinite' }} />
                      : <FileSpreadsheet size={32} style={{ color: 'var(--accent-brand)' }} />
                    }
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {loading ? 'Parsing file…' : fileName || 'Click to select file'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Supports XLSX / XLS — Sampath Bank Vishwa Internet Banking format
                      </div>
                    </div>
                  </button>

                  {error && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px',
                      borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      width: '100%', boxSizing: 'border-box',
                    }}>
                      <AlertCircle size={16} style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 13, color: 'var(--accent-red)' }}>{error}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Preview table */}
              {step === 2 && !imported && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Summary cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Transactions', value: rows.length.toString(), color: 'var(--text-primary)' },
                      { label: 'Total Income',  value: formatCurrency(incomeTotal, currency),  color: 'var(--accent-green)' },
                      { label: 'Total Expenses', value: formatCurrency(expenseTotal, currency), color: 'var(--accent-red)' },
                    ].map(s => (
                      <div key={s.label} style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {parseResult && parseResult.skipped > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                      {parseResult.skipped} rows were skipped (empty description or zero amount).
                    </div>
                  )}

                  {/* Preview table */}
                  <div style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-primary)' }}>
                          {['Date', 'Description', 'Category', 'Amount'].map(h => (
                            <th key={h} style={{
                              padding: '10px 14px', textAlign: h === 'Amount' ? 'right' : 'left',
                              fontWeight: 600, color: 'var(--text-muted)', fontSize: 11,
                              textTransform: 'uppercase', letterSpacing: '0.05em',
                              borderBottom: '1px solid var(--border)',
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 200).map((row, i) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom: '1px solid var(--border)',
                              background: i % 2 === 0 ? 'transparent' : 'var(--bg-primary)',
                            }}
                          >
                            <td style={{ padding: '9px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {row.date}
                            </td>
                            <td style={{ padding: '9px 14px', color: 'var(--text-primary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row.particulars}
                            </td>
                            <td style={{ padding: '9px 14px' }}>
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <select
                                  value={effectiveCategory(i)}
                                  onChange={e => setCategoryOverrides(prev => ({ ...prev, [i]: e.target.value as TransactionCategory }))}
                                  style={{
                                    appearance: 'none', padding: '3px 22px 3px 8px',
                                    borderRadius: 6, border: '1px solid var(--border)',
                                    background: 'var(--bg-card)', color: 'var(--text-primary)',
                                    fontSize: 12, cursor: 'pointer', outline: 'none',
                                  }}
                                >
                                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown size={10} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                              </div>
                            </td>
                            <td style={{
                              padding: '9px 14px', textAlign: 'right',
                              fontWeight: 600, fontFamily: 'monospace',
                              color: row.amount >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                              whiteSpace: 'nowrap',
                            }}>
                              {row.amount >= 0 ? '+' : ''}{formatCurrency(row.amount, currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 200 && (
                      <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)' }}>
                        Showing first 200 of {rows.length} rows — all {rows.length} will be imported.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Success state */}
              {imported && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 24px', textAlign: 'center' }}>
                  <CheckCircle2 size={52} style={{ color: 'var(--accent-green)' }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                      {rows.length} transactions imported!
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                      All transactions have been added to <strong style={{ color: 'var(--text-primary)' }}>{selectedAccount?.name}</strong>.
                    </div>
                  </div>
                  <button
                    onClick={resetAndClose}
                    style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: 'var(--accent-brand)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            {!imported && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 24px', borderTop: '1px solid var(--border)',
              }}>
                <button
                  onClick={() => { setError(''); step > 0 ? setStep(s => s - 1) : resetAndClose(); }}
                  style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}
                >
                  {step === 0 ? 'Cancel' : 'Back'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {step === 0 && (
                    <button
                      onClick={handleNext0}
                      disabled={!selectedAccountId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 20px', borderRadius: 8, border: 'none',
                        background: selectedAccountId ? 'var(--accent-brand)' : 'var(--border)',
                        color: selectedAccountId ? '#fff' : 'var(--text-muted)',
                        fontSize: 14, fontWeight: 600,
                        cursor: selectedAccountId ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Continue <ChevronRight size={16} />
                    </button>
                  )}
                  {step === 1 && (
                    <button
                      onClick={handlePickFile}
                      disabled={loading}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-brand)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Upload size={16} /> Select File
                    </button>
                  )}
                  {step === 2 && (
                    <button
                      onClick={handleImport}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-green)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <CheckCircle2 size={16} /> Import {rows.length} Transactions
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
