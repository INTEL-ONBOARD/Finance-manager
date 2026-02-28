import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

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
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  limit?: number; // for credit cards
  color: string;
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
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (g: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  toggleBillPaid: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Derived values
  totalBalance: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySaved: number;
  savingsRate: number;
  creditUtilization: number;
  unreadNotificationCount: number;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside FinanceProvider');
  return ctx;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load data from MongoDB on first mount (Electron environment only)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electron?.db) {
      setHydrated(true);
      return;
    }
    Promise.all([
      window.electron.db.transactions.getAll(),
      window.electron.db.goals.getAll(),
      window.electron.db.bills.getAll(),
      window.electron.db.accounts.getAll(),
      window.electron.db.notifications.getAll(),
    ]).then(([txns, gs, bs, accs, notifs]) => {
      setTransactions(txns);
      setGoals(gs);
      setBills(bs);
      setAccounts(accs);
      setNotifications(notifs);
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const monthTxns = transactions.filter(t => t.date.startsWith(currentMonth));

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
  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const newDoc: Transaction = { ...t, id: `t${Date.now()}` };
    setTransactions(prev => [newDoc, ...prev]);
    window.electron?.db.transactions.add(newDoc);
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    window.electron?.db.transactions.delete(id);
  }, []);

  const addGoal = useCallback((g: Omit<SavingsGoal, 'id'>) => {
    const newDoc: SavingsGoal = { ...g, id: `g${Date.now()}` };
    setGoals(prev => [...prev, newDoc]);
    window.electron?.db.goals.add(newDoc);
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    window.electron?.db.goals.update(id, updates);
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    window.electron?.db.goals.delete(id);
  }, []);

  const toggleBillPaid = useCallback((id: string) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, paid: !b.paid } : b));
    window.electron?.db.bills.togglePaid(id);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    window.electron?.db.notifications.markRead(id);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    window.electron?.db.notifications.markAllRead();
  }, []);

  return (
    <FinanceContext.Provider value={{
      transactions, goals, bills, accounts, notifications,
      addTransaction, deleteTransaction,
      addGoal, updateGoal, deleteGoal,
      toggleBillPaid,
      markNotificationRead, markAllNotificationsRead,
      totalBalance, netWorth, monthlyIncome, monthlyExpenses,
      monthlySaved, savingsRate, creditUtilization,
      unreadNotificationCount,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}
