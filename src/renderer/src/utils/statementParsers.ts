// src/renderer/src/utils/statementParsers.ts
import * as XLSX from 'xlsx';
import type { Transaction, TransactionCategory } from '@/context/FinanceContext';

// ─── Category mapping ────────────────────────────────────────────────────────

const CATEGORY_RULES: { pattern: RegExp; category: TransactionCategory }[] = [
  { pattern: /spotify/i,                                                                                              category: 'Spotify' },
  { pattern: /netflix/i,                                                                                              category: 'Netflix' },
  { pattern: /pickme food|food delivery|uber eats|domino|pizza|kfc|mcdonalds|burger|restaurant|cafe|grill|bakery/i,  category: 'Dining' },
  { pattern: /pickme|uber|ola|taxi|bus|train|fuel|petrol|toll/i,                                                     category: 'Transport' },
  { pattern: /keells|cargills|arpico|spar|supermarket|grocery|food city/i,                                           category: 'Groceries' },
  { pattern: /salary|payroll|income|revo|company|employer/i,                                                         category: 'Salary' },
  { pattern: /freelance|upwork|fiverr|invoice/i,                                                                     category: 'Freelance' },
  { pattern: /dividend|interest earned|investment return/i,                                                           category: 'Investment' },
  { pattern: /refund|reversal|cashback/i,                                                                             category: 'Refund' },
  { pattern: /electric|water|ceb|nwsdb|utility|bill payment|dialog|slt|mobitel|airtel/i,                             category: 'Utilities' },
  { pattern: /rent|lease|landlord/i,                                                                                  category: 'Rent' },
  { pattern: /gym|fitness|sport|yoga/i,                                                                               category: 'Gym' },
  { pattern: /internet|wifi|broadband/i,                                                                              category: 'Internet' },
  { pattern: /pharmacy|hospital|clinic|doctor|health|medical|dental/i,                                                category: 'Health' },
  { pattern: /youtube|apple|openai|chatgpt|disney|prime|hulu|adobe|canva|figma/i,                                    category: 'Shopping' },
  { pattern: /amazon|ebay|aliexpress|shopping|mall|store|shop/i,                                                     category: 'Shopping' },
];

function guessCategory(particulars: string): TransactionCategory {
  for (const { pattern, category } of CATEGORY_RULES) {
    if (pattern.test(particulars)) return category;
  }
  return 'Other';
}

// ─── Date parsing ─────────────────────────────────────────────────────────────

/** Converts "DD-MM-YYYY" → "YYYY-MM-DD" */
function parseSampathDate(raw: string): string {
  const parts = raw.split('-');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return raw;
}

// ─── Amount parsing ────────────────────────────────────────────────────────────

/** Removes commas and sign, returns absolute value. */
function parseAmount(raw: string | number): number {
  if (typeof raw === 'number') return Math.abs(raw);
  return Math.abs(parseFloat(String(raw).replace(/,/g, '')) || 0);
}

// ─── Public types ──────────────────────────────────────────────────────────────

export interface ParsedRow {
  date: string;           // YYYY-MM-DD
  particulars: string;
  amount: number;         // positive = income, negative = expense
  category: TransactionCategory;
  balance: number;
}

export interface ParseResult {
  rows: ParsedRow[];
  bankName: string;
  detectedFormat: string;
  skipped: number;
}

// ─── Sampath Bank XLSX parser ──────────────────────────────────────────────────

/**
 * Parse a base64-encoded XLSX buffer in the Sampath Bank Vishwa Internet Banking format.
 * Expected columns: Tran Date | Particulars | DR/CR | Amount | Balance
 */
export function parseSampathXLSX(base64: string): ParseResult {
  const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  // Find header row — scan first 20 rows for "Tran Date"
  let headerIdx = -1;
  let colDate = -1, colParticulars = -1, colDRCR = -1, colAmount = -1, colBalance = -1;

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i] as string[];
    const lower = row.map(c => String(c ?? '').toLowerCase().trim());
    const dateCol = lower.findIndex(c => c.includes('tran date') || c === 'date');
    if (dateCol !== -1) {
      headerIdx = i;
      colDate        = dateCol;
      colParticulars = lower.findIndex(c => c.includes('particular'));
      colDRCR        = lower.findIndex(c => c.includes('dr/cr') || c === 'dr' || c === 'cr');
      colAmount      = lower.findIndex(c => c === 'amount' || c.includes('amount'));
      colBalance     = lower.findIndex(c => c.includes('balance'));
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error(
      'Could not detect Sampath Bank statement format. ' +
      'Expected a "Tran Date" column in the first 20 rows.'
    );
  }

  const parsed: ParsedRow[] = [];
  let skipped = 0;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] as (string | number)[];
    const rawDate     = String(row[colDate] ?? '').trim();
    const particulars = String(row[colParticulars] ?? '').trim();
    const drCr        = String(row[colDRCR] ?? '').trim().toUpperCase();
    const rawAmount   = row[colAmount];
    const rawBalance  = row[colBalance];

    if (!rawDate || !particulars) { skipped++; continue; }

    const amountAbs = parseAmount(rawAmount as string);
    if (amountAbs === 0) { skipped++; continue; }

    // D = debit (expense, negative), C = credit (income, positive)
    const amount  = drCr === 'C' ? amountAbs : -amountAbs;
    const date    = parseSampathDate(rawDate);
    const balance = parseAmount(rawBalance as string);

    parsed.push({
      date,
      particulars,
      amount,
      category: guessCategory(particulars),
      balance,
    });
  }

  return {
    rows: parsed,
    bankName: 'Sampath Bank',
    detectedFormat: 'Sampath Vishwa XLSX',
    skipped,
  };
}

// ─── Conversion ────────────────────────────────────────────────────────────────

/** Convert ParsedRow[] to Transaction inputs ready for addTransactions(). */
export function parsedRowsToTransactions(
  rows: ParsedRow[],
  accountName: string,
): Omit<Transaction, 'id'>[] {
  return rows.map(r => ({
    name: r.particulars,
    category: r.category,
    date: r.date,
    amount: r.amount,
    account: accountName,
  }));
}

// ─── Auto-detect entry point ───────────────────────────────────────────────────

/** Parse using an explicit template ID. Throws if template or file type unsupported. */
export function parseStatement(base64: string, fileName: string, templateId?: string): ParseResult {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext !== 'xlsx' && ext !== 'xls') {
    throw new Error(`Unsupported file type: .${ext ?? 'unknown'}. Please upload an XLSX or XLS file.`);
  }
  // All current templates use the same Sampath XLSX format; extend here as new templates are added.
  switch (templateId) {
    case 'sampath-vishwa':
    default:
      return parseSampathXLSX(base64);
  }
}
