import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';

// ── Types ────────────────────────────────────────────────────────────────────

interface UserSettings {
  currency?: string;
  notifs?: {
    billReminders: boolean;
    goalProgress: boolean;
    largeTransactions: boolean;
    monthlyReport: boolean;
    weeklyDigest: boolean;
  };
  [key: string]: unknown;
}

export type TransactionCategory =
  | 'Salary' | 'Freelance' | 'Investment' | 'Refund'
  | 'Groceries' | 'Dining' | 'Transport' | 'Utilities'
  | 'Rent' | 'Gym' | 'Internet' | 'Spotify' | 'Netflix'
  | 'Shopping' | 'Health' | 'Other';

export interface Transaction {
  id: string;
  name: string;
  category: TransactionCategory;
  date: string; // 'YYYY-MM-DD'
  amount: number; // negative = expense, positive = income
  account: string;
  note?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  target: number;
  current: number;
  color: string;
  deadline: string; // 'Mon YYYY'
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // day of month
  category: string;
  color: string;
  paid: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan';
  balance: number;
  limit?: number;             // credit: credit limit; loan: original loan amount
  color: string;
  bank?: string;              // e.g. "Commercial Bank of Ceylon"
  branch?: string;            // e.g. "Colombo Fort"
  accountNumber?: string;     // optional, masked in UI
  cardNetwork?: 'visa' | 'mastercard' | 'amex';
  linkedAccountId?: string;   // credit: optional link to another account
  interestRate?: number;      // savings/loan: annual %
  loanMaturityDate?: string;  // loan: ISO date string
  monthlyPayment?: number;    // loan: monthly instalment
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'alert' | 'info' | 'success';
}


// ── Context ──────────────────────────────────────────────────────────────────

interface FinanceContextType {
  transactions: Transaction[];
  goals: SavingsGoal[];
  bills: Bill[];
  accounts: Account[];
  notifications: Notification[];
  currency: string;
  setCurrency: (c: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  addTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (g: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  addBill: (b: Omit<Bill, 'id'>) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  toggleBillPaid: (id: string) => void;
  addAccount: (a: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (n: Omit<Notification, 'read'>) => void;
  // Selected month for all month-scoped views (YYYY-MM)
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  // Derived values
  totalBalance: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySaved: number;
  savingsRate: number;
  creditUtilization: number;
  unreadNotificationCount: number;
  dbError: string | null;
}

function buildNotifications(
  bills: Bill[],
  goals: SavingsGoal[],
  transactions: Transaction[],
  existingIds: Set<string>,
  currency: string
): Array<Omit<Notification, 'read'>> {
  const results: Array<Omit<Notification, 'read'>> = [];
  const now = new Date();
  const todayDay = now.getDate();
  const ym = now.toISOString().slice(0, 7);

  for (const bill of bills) {
    if (bill.paid) continue;
    const daysUntil = bill.dueDay - todayDay;
    const id = `notif_bill_due_${bill.id}_${ym}`;
    if (existingIds.has(id)) continue;
    if (daysUntil < 0) {
      results.push({ id, title: `${bill.name} is overdue!`, body: `${formatCurrency(bill.amount, currency)} was due on the ${bill.dueDay}th.`, time: 'Just now', type: 'alert' });
    } else if (daysUntil === 0) {
      results.push({ id, title: `${bill.name} due today`, body: `${formatCurrency(bill.amount, currency)} is due today.`, time: 'Just now', type: 'alert' });
    } else if (daysUntil <= 3) {
      results.push({ id, title: `${bill.name} due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`, body: `${formatCurrency(bill.amount, currency)} is due on the ${bill.dueDay}th.`, time: 'Just now', type: 'alert' });
    }
  }

  for (const goal of goals) {
    if (goal.target <= 0) continue;
    const pct = (goal.current / goal.target) * 100;
    for (const milestone of [50, 75, 100] as const) {
      if (pct >= milestone) {
        const id = `notif_goal_${goal.id}_${milestone}`;
        if (existingIds.has(id)) continue;
        results.push({
          id,
          title: milestone === 100 ? `${goal.name} goal reached!` : `${goal.name} is ${milestone}% complete`,
          body: milestone === 100
            ? `You've hit your ${formatCurrency(goal.target, currency, 0)} target!`
            : `${formatCurrency(goal.current, currency, 0)} of ${formatCurrency(goal.target, currency, 0)} saved.`,
          time: 'Just now',
          type: 'success',
        });
      }
    }
  }

  for (const txn of transactions) {
    if (!txn.date.startsWith(ym)) continue;
    if (Math.abs(txn.amount) < 500) continue;
    const id = `notif_txn_large_${txn.id}`;
    if (existingIds.has(id)) continue;
    results.push({
      id,
      title: `Large transaction: ${txn.name}`,
      body: `${formatCurrency(Math.abs(txn.amount), currency, 0)} ${txn.amount < 0 ? 'expense' : 'income'} on ${txn.account}.`,
      time: 'Just now',
      type: txn.amount < 0 ? 'alert' : 'success',
    });
  }

  const summaryId = `notif_monthly_${ym}`;
  if (!existingIds.has(summaryId)) {
    results.push({
      id: summaryId,
      title: `${now.toLocaleDateString('en-US', { month: 'long' })} summary ready`,
      body: `Your ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} financial summary is available.`,
      time: 'Just now',
      type: 'info',
    });
  }

  return results;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside FinanceProvider');
  return ctx;
}

interface FinanceProviderProps {
  userId: string | null;
  children: ReactNode;
}

export function FinanceProvider({ userId, children }: FinanceProviderProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currency, setCurrency] = useState<string>('USD');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  // Re-hydrate whenever the logged-in user changes
  useEffect(() => {
    if (!userId || typeof window === 'undefined' || !window.electron?.db) {
      setTransactions([]);
      setGoals([]);
      setBills([]);
      setAccounts([]);
      setNotifications([]);
      setCurrency('USD');
      setSettings(null);
      return;
    }
    // Load currency setting separately (settings.get returns a single doc)
    window.electron.db.settings?.get(userId).then((s: Record<string, unknown> | null) => {
      setCurrency((s?.currency as string) ?? 'USD');
      setSettings(s as UserSettings | null);
    }).catch(() => { /* keep default USD */ });
    Promise.all([
      window.electron.db.transactions.getAll(userId),
      window.electron.db.goals.getAll(userId),
      window.electron.db.bills.getAll(userId),
      window.electron.db.accounts.getAll(userId),
      window.electron.db.notifications.getAll(userId),
    ]).then(([txns, gs, bs, accs, notifs]) => {
      setTransactions(txns);
      setGoals(gs);
      setBills(bs);
      setAccounts(accs);
      setNotifications(notifs as Notification[]);
      // Generate smart notifications from live data
      const existingIds = new Set((notifs as Notification[]).map(n => n.id));
      const generated = buildNotifications(bs as Bill[], gs as SavingsGoal[], txns as Transaction[], existingIds, currency);
      for (const n of generated) {
        const doc: Notification = { ...n, read: false };
        setNotifications(prev => prev.some(x => x.id === doc.id) ? prev : [doc, ...prev]);
        window.electron?.db.notifications.add(userId, doc);
      }
    }).catch((err: unknown) => {
      console.error(err);
      setDbError('Unable to load your data. Please check your connection.');
    });
  }, [userId]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const monthTxns = transactions.filter(t => t.date.startsWith(selectedMonth));

  const monthlyIncome   = monthTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const monthlySaved    = monthlyIncome - monthlyExpenses;
  const savingsRate     = monthlyIncome > 0 ? Math.round((monthlySaved / monthlyIncome) * 100) : 0;

  const checkingAndSavings = accounts.filter(a => a.type !== 'credit').reduce((s, a) => s + a.balance, 0);
  const totalBalance        = checkingAndSavings;
  const totalAssets         = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalLiabilities    = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);
  const netWorth            = totalAssets - totalLiabilities;

  const creditCard         = accounts.find(a => a.type === 'credit');
  const creditUtilization  = creditCard && creditCard.limit
    ? Math.round((Math.abs(creditCard.balance) / creditCard.limit) * 100)
    : 0;

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // ── Actions ────────────────────────────────────────────────────────────────
  const addNotification = useCallback((n: Omit<Notification, 'read'>) => {
    if (!userId) return;
    const doc: Notification = { ...n, read: false };
    setNotifications(prev => {
      if (prev.some(x => x.id === doc.id)) return prev;
      return [doc, ...prev];
    });
    window.electron?.db.notifications.add(userId, doc);
    const shouldNotify = (() => {
      if (!settings?.notifs) return true; // no prefs set → default to on
      if (n.type === 'alert')   return settings.notifs.billReminders !== false;
      if (n.type === 'info')    return settings.notifs.monthlyReport !== false;
      if (n.type === 'success') return settings.notifs.goalProgress !== false;
      return true;
    })();
    if (shouldNotify) window.electron?.notify.send(n.title, n.body);
  }, [userId, settings]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    if (!userId) return;
    const newDoc: Transaction = { ...t, id: `t${Date.now()}` };
    setTransactions(prev => [newDoc, ...prev]);
    window.electron?.db.transactions.add(userId, newDoc);
    if (Math.abs(t.amount) >= 500) {
      addNotification({
        id: `notif_txn_large_${newDoc.id}`,
        title: `Large transaction: ${newDoc.name}`,
        body: `${formatCurrency(Math.abs(newDoc.amount), currency, 0)} ${newDoc.amount < 0 ? 'expense' : 'income'} on ${newDoc.account}.`,
        time: 'Just now',
        type: newDoc.amount < 0 ? 'alert' : 'success',
      });
    }
  }, [userId, addNotification, currency]);

  const addTransactions = useCallback((items: Omit<Transaction, 'id'>[]) => {
    if (!userId) return;
    const now = Date.now();
    const newDocs: Transaction[] = items.map((t, i) => ({ ...t, id: `t${now}_${i}` }));
    setTransactions(prev => [...newDocs, ...prev]);
    newDocs.forEach(doc => window.electron?.db.transactions.add(userId!, doc));
  }, [userId]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    if (!userId) return;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    window.electron?.db.transactions.update(userId, id, updates);
  }, [userId]);

  const deleteTransaction = useCallback((id: string) => {
    if (!userId) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    window.electron?.db.transactions.delete(userId, id);
  }, [userId]);

  const addGoal = useCallback((g: Omit<SavingsGoal, 'id'>) => {
    if (!userId) return;
    const newDoc: SavingsGoal = { ...g, id: `g${Date.now()}` };
    setGoals(prev => [...prev, newDoc]);
    window.electron?.db.goals.add(userId, newDoc);
  }, [userId]);

  const updateGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    if (!userId) return;
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    window.electron?.db.goals.update(userId, id, updates);
    const existingGoal = goals.find(g => g.id === id);
    if (existingGoal) {
      const updated = { ...existingGoal, ...updates };
      if (updated.target > 0) {
        const pct = (updated.current / updated.target) * 100;
        for (const milestone of [50, 75, 100] as const) {
          const notifId = `notif_goal_${id}_${milestone}`;
          if (pct >= milestone && !notifications.some(n => n.id === notifId)) {
            addNotification({
              id: notifId,
              title: milestone === 100 ? `${updated.name} goal reached!` : `${updated.name} is ${milestone}% complete`,
              body: milestone === 100
                ? `You've hit your ${formatCurrency(updated.target, currency, 0)} target!`
                : `${formatCurrency(updated.current, currency, 0)} of ${formatCurrency(updated.target, currency, 0)} saved.`,
              time: 'Just now',
              type: 'success',
            });
          }
        }
      }
    }
  }, [userId, goals, notifications, addNotification, currency]);

  const deleteGoal = useCallback((id: string) => {
    if (!userId) return;
    setGoals(prev => prev.filter(g => g.id !== id));
    window.electron?.db.goals.delete(userId, id);
  }, [userId]);

  const addBill = useCallback((b: Omit<Bill, 'id'>) => {
    if (!userId) return;
    const newDoc: Bill = { ...b, id: `b${Date.now()}` };
    setBills(prev => [...prev, newDoc]);
    window.electron?.db.bills.add(userId, newDoc);
  }, [userId]);

  const updateBill = useCallback((id: string, updates: Partial<Bill>) => {
    if (!userId) return;
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    window.electron?.db.bills.update(userId, id, updates);
  }, [userId]);

  const deleteBill = useCallback((id: string) => {
    if (!userId) return;
    setBills(prev => prev.filter(b => b.id !== id));
    window.electron?.db.bills.delete(userId, id);
  }, [userId]);

  const toggleBillPaid = useCallback((id: string) => {
    if (!userId) return;
    setBills(prev => prev.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
    window.electron?.db.bills.togglePaid(userId, id);
  }, [userId]);

  const markNotificationRead = useCallback((id: string) => {
    if (!userId) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    window.electron?.db.notifications.markRead(userId, id);
  }, [userId]);

  const markAllNotificationsRead = useCallback(() => {
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    window.electron?.db.notifications.markAllRead(userId);
  }, [userId]);

  const addAccount = useCallback((a: Omit<Account, 'id'>) => {
    if (!userId) return;
    const newDoc: Account = { ...a, id: `a${Date.now()}` };
    setAccounts(prev => [...prev, newDoc]);
    window.electron?.db.accounts.add(userId, newDoc);
  }, [userId]);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    if (!userId) return;
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    window.electron?.db.accounts.update(userId, id, updates);
  }, [userId]);

  const deleteAccount = useCallback((id: string) => {
    if (!userId) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
    window.electron?.db.accounts.delete(userId, id);
  }, [userId]);

  return (
    <FinanceContext.Provider value={{
      transactions, goals, bills, accounts, notifications,
      currency, setCurrency,
      selectedMonth, setSelectedMonth,
      addTransaction, addTransactions, updateTransaction, deleteTransaction,
      addGoal, updateGoal, deleteGoal,
      addBill, updateBill, deleteBill, toggleBillPaid,
      addAccount, updateAccount, deleteAccount,
      markNotificationRead, markAllNotificationsRead, addNotification,
      totalBalance, netWorth, monthlyIncome, monthlyExpenses,
      monthlySaved, savingsRate, creditUtilization,
      unreadNotificationCount,
      dbError,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}
