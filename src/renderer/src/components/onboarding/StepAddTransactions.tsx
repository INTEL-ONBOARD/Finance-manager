import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, SkipForward, Plus, Upload } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import type { TransactionCategory } from '@/context/FinanceContext';

const CATEGORIES: TransactionCategory[] = [
  'Salary','Freelance','Investment','Refund',
  'Groceries','Dining','Transport','Utilities',
  'Rent','Gym','Internet','Spotify','Netflix',
  'Shopping','Health','Other',
];

interface TxRow {
  id: string;
  name: string;
  amount: string;
  isExpense: boolean;
  category: TransactionCategory;
  date: string;
}

function emptyRow(): TxRow {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: '',
    isExpense: true,
    category: 'Other',
    date: new Date().toISOString().slice(0, 10),
  };
}

interface StepAddTransactionsProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function StepAddTransactions({ onNext, onSkip, onBack }: StepAddTransactionsProps) {
  const { addTransactions } = useFinance();
  const [tab, setTab] = useState<'manual' | 'csv'>('manual');
  const [rows, setRows] = useState<TxRow[]>([emptyRow()]);
  const [csvPreview, setCsvPreview] = useState<TxRow[] | null>(null);
  const [csvError, setCsvError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const inputStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 13,
    outline: 'none',
    width: '100%',
  };

  const updateRow = (i: number, field: keyof TxRow, value: string | boolean) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const parseCsv = (text: string) => {
    setCsvError('');
    const lines = text.trim().split('\n');
    const header = lines[0].toLowerCase().replace(/\s/g, '');
    if (!header.includes('name') || !header.includes('amount')) {
      setCsvError('CSV must have at least "name" and "amount" columns.');
      return;
    }
    const cols = lines[0].split(',').map(c => c.trim().toLowerCase());
    const nameIdx = cols.indexOf('name');
    const amtIdx = cols.indexOf('amount');
    const catIdx = cols.indexOf('category');
    const dateIdx = cols.indexOf('date');
    const parsed: TxRow[] = [];
    for (let i = 1; i < lines.length && i <= 10; i++) {
      const parts = lines[i].split(',').map(c => c.trim());
      if (parts.length < 2) continue;
      const amt = parseFloat(parts[amtIdx] || '0');
      parsed.push({
        id: crypto.randomUUID(),
        name: parts[nameIdx] || 'Transaction',
        amount: Math.abs(amt).toString(),
        isExpense: amt < 0,
        category: (parts[catIdx] as TransactionCategory) || 'Other',
        date: parts[dateIdx] || new Date().toISOString().slice(0, 10),
      });
    }
    if (parsed.length === 0) { setCsvError('No valid rows found in CSV.'); return; }
    setCsvPreview(parsed);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => parseCsv(e.target?.result as string);
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSave = async (txRows: TxRow[]) => {
    setSaving(true);
    setError('');
    try {
      const toAdd = txRows
        .filter(r => r.name.trim() && r.amount)
        .map(r => ({
          name: r.name.trim(),
          amount: r.isExpense ? -Math.abs(parseFloat(r.amount)) : Math.abs(parseFloat(r.amount)),
          category: r.category,
          date: r.date,
          account: 'Default',
        }));
      if (toAdd.length > 0) addTransactions(toAdd);
      onNext();
    } catch {
      setError('Failed to save transactions.');
    } finally {
      setSaving(false);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 13, fontWeight: 600,
    padding: '6px 16px', borderRadius: 8,
    cursor: 'pointer',
    background: active ? 'var(--accent-brand)' : 'transparent',
    color: active ? 'white' : 'var(--text-secondary)',
    border: 'none',
    transition: 'all 0.15s',
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Log your first transactions
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Add a few recent transactions to get your dashboard going.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', width: 'fit-content' }}>
        <button style={tabStyle(tab === 'manual')} onClick={() => setTab('manual')}>Enter manually</button>
        <button style={tabStyle(tab === 'csv')} onClick={() => setTab('csv')}>Upload CSV</button>
      </div>

      {/* Manual tab */}
      {tab === 'manual' && (
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <div key={row.id} className="flex gap-2 items-end p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              {/* +/- toggle */}
              <button type="button"
                onClick={() => updateRow(i, 'isExpense', !row.isExpense)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: row.isExpense ? 'rgba(248,113,113,0.15)' : 'rgba(34,197,94,0.15)',
                  color: row.isExpense ? 'var(--accent-red)' : 'var(--accent-green)',
                  fontSize: 18, fontWeight: 700, lineHeight: 1,
                }}>
                {row.isExpense ? '−' : '+'}
              </button>
              {/* Name */}
              <input style={{ ...inputStyle, flex: 2 } as React.CSSProperties} placeholder="Description" value={row.name}
                onChange={e => updateRow(i, 'name', e.target.value)} />
              {/* Amount */}
              <input style={{ ...inputStyle, width: 90 }} type="number" placeholder="0.00"
                value={row.amount} min="0" step="0.01"
                onChange={e => updateRow(i, 'amount', e.target.value)} />
              {/* Category */}
              <select style={{ ...inputStyle, flex: 1 } as React.CSSProperties} value={row.category}
                onChange={e => updateRow(i, 'category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {/* Date */}
              <input style={{ ...inputStyle, width: 130 }} type="date" value={row.date}
                onChange={e => updateRow(i, 'date', e.target.value)} />
            </div>
          ))}
          {rows.length < 3 && (
            <button type="button"
              onClick={() => setRows(prev => [...prev, emptyRow()])}
              className="flex items-center gap-1 self-start transition-all hover:opacity-80"
              style={{ fontSize: 13, color: 'var(--accent-brand)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Plus size={14} /> Add another
            </button>
          )}
        </div>
      )}

      {/* CSV tab */}
      {tab === 'csv' && (
        <div className="flex flex-col gap-3">
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Expected columns: <code style={{ color: 'var(--accent-brand)' }}>name, amount, category, date</code>
            <br />Example: <code style={{ color: 'var(--text-secondary)' }}>Groceries,-45.50,Groceries,2026-02-28</code>
          </p>

          {!csvPreview ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-black/5"
              style={{ border: '2px dashed var(--border)', padding: '32px 20px', borderRadius: 16 }}>
              <Upload size={28} style={{ color: 'var(--text-muted)' }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                Drag & drop a CSV file here, or <span style={{ color: 'var(--accent-brand)', fontWeight: 600 }}>click to browse</span>
              </p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Preview — {csvPreview.length} row(s)</p>
              <div style={{ maxHeight: 180, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      {['Name','Amount','Category','Date'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((r, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 10px', color: 'var(--text-primary)' }}>{r.name}</td>
                        <td style={{ padding: '6px 10px', color: r.isExpense ? 'var(--accent-red)' : 'var(--accent-green)', fontFamily: 'Geist Mono, monospace' }}>
                          {r.isExpense ? '-' : '+'}{r.amount}
                        </td>
                        <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.category}</td>
                        <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => setCsvPreview(null)}
                style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start', padding: 0 }}>
                ← Choose different file
              </button>
            </div>
          )}
          {csvError && <p style={{ fontSize: 13, color: 'var(--accent-red)' }}>{csvError}</p>}
        </div>
      )}

      {error && <p style={{ fontSize: 13, color: 'var(--accent-red)' }}>{error}</p>}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-1">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5"
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <ArrowLeft size={15} /> Back
        </button>
        <button type="button" onClick={onSkip}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5"
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <SkipForward size={15} /> Skip for now
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          type="button"
          disabled={saving}
          onClick={() => handleSave(tab === 'csv' && csvPreview ? csvPreview : rows)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold"
          style={{
            background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))',
            color: 'white', fontSize: 13,
            opacity: saving ? 0.7 : 1,
            border: 'none', cursor: 'pointer',
          }}>
          {saving ? 'Saving…' : <><span>Continue</span><ArrowRight size={15} /></>}
        </motion.button>
      </div>
    </div>
  );
}
