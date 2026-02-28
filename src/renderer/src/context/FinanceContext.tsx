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

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 't1',  name: 'Monthly Salary',      category: 'Salary',     date: '2026-02-25', amount:  5200,   account: 'Checking',    note: 'February paycheck' },
  { id: 't2',  name: 'Whole Foods Market',  category: 'Groceries',  date: '2026-02-24', amount: -84.32,  account: 'Visa ••4521' },
  { id: 't3',  name: 'Netflix',             category: 'Netflix',    date: '2026-02-23', amount: -15.99,  account: 'Visa ••4521' },
  { id: 't4',  name: 'Freelance Project',   category: 'Freelance',  date: '2026-02-22', amount:  850,    account: 'Checking',    note: 'UI design for client' },
  { id: 't5',  name: 'Rent — Feb',          category: 'Rent',       date: '2026-02-20', amount: -1450,   account: 'Checking' },
  { id: 't6',  name: 'Uber',                category: 'Transport',  date: '2026-02-19', amount: -18.50,  account: 'Visa ••4521' },
  { id: 't7',  name: 'Chipotle',            category: 'Dining',     date: '2026-02-18', amount: -13.75,  account: 'Visa ••4521' },
  { id: 't8',  name: 'Gym Membership',      category: 'Gym',        date: '2026-02-15', amount: -49.99,  account: 'Checking' },
  { id: 't9',  name: 'Electric Bill',       category: 'Utilities',  date: '2026-02-14', amount: -112.40, account: 'Checking' },
  { id: 't10', name: 'Spotify',             category: 'Spotify',    date: '2026-02-13', amount: -9.99,   account: 'Visa ••4521' },
  { id: 't11', name: 'Amazon Order',        category: 'Shopping',   date: '2026-02-11', amount: -67.40,  account: 'Visa ••4521' },
  { id: 't12', name: 'Doctor Visit',        category: 'Health',     date: '2026-02-08', amount: -45.00,  account: 'Checking' },
  { id: 't13', name: 'Investment Dividend', category: 'Investment', date: '2026-02-05', amount:  142.50, account: 'Investment' },
  { id: 't14', name: 'Trader Joe\'s',       category: 'Groceries',  date: '2026-02-04', amount: -52.10,  account: 'Visa ••4521' },
  { id: 't15', name: 'Gas Station',         category: 'Transport',  date: '2026-02-02', amount: -48.20,  account: 'Visa ••4521' },
];

const SEED_GOALS: SavingsGoal[] = [
  { id: 'g1', name: 'Emergency Fund',      icon: 'Umbrella',  target: 15000, current: 9840,  color: '#60a5fa', deadline: 'Jun 2026' },
  { id: 'g2', name: 'Japan Trip',          icon: 'Plane',     target: 4500,  current: 2200,  color: '#f59e0b', deadline: 'Aug 2026' },
  { id: 'g3', name: 'New Laptop',          icon: 'Laptop',    target: 2000,  current: 1650,  color: '#4ade80', deadline: 'Mar 2026' },
  { id: 'g4', name: 'House Down Payment',  icon: 'Home',      target: 40000, current: 11200, color: '#a78bfa', deadline: 'Dec 2027' },
];

const SEED_BILLS: Bill[] = [
  { id: 'b1', name: 'Rent',           amount: 1450,  dueDay: 1,  category: 'Housing',      color: '#f87171', paid: true },
  { id: 'b2', name: 'Electric',       amount: 112,   dueDay: 14, category: 'Utilities',    color: '#60a5fa', paid: true },
  { id: 'b3', name: 'Internet',       amount: 59.99, dueDay: 18, category: 'Utilities',    color: '#60a5fa', paid: false },
  { id: 'b4', name: 'Netflix',        amount: 15.99, dueDay: 23, category: 'Subscription', color: '#f87171', paid: true },
  { id: 'b5', name: 'Spotify',        amount: 9.99,  dueDay: 13, category: 'Subscription', color: '#4ade80', paid: true },
  { id: 'b6', name: 'Gym',            amount: 49.99, dueDay: 15, category: 'Health',        color: '#34d399', paid: true },
  { id: 'b7', name: 'Phone Plan',     amount: 45,    dueDay: 28, category: 'Utilities',    color: '#a78bfa', paid: false },
  { id: 'b8', name: 'Car Insurance',  amount: 142,   dueDay: 5,  category: 'Insurance',    color: '#fbbf24', paid: false },
];

const SEED_ACCOUNTS: Account[] = [
  { id: 'a1', name: 'Checking Account', type: 'checking',   balance: 4820.50,  color: '#4ade80' },
  { id: 'a2', name: 'Savings Account',  type: 'savings',    balance: 9840.00,  color: '#60a5fa' },
  { id: 'a3', name: 'Visa ••4521',      type: 'credit',     balance: -1260.00, limit: 7000, color: '#f87171' },
  { id: 'a4', name: 'Investment',       type: 'investment', balance: 8240.00,  color: '#a78bfa' },
];

const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Bill Due Tomorrow', body: 'Internet bill of $59.99 is due on Feb 27.', time: '2h ago', read: false, type: 'alert' },
  { id: 'n2', title: 'Goal Almost Reached!', body: 'New Laptop goal is at 83% — only $350 to go!', time: '1d ago', read: false, type: 'success' },
  { id: 'n3', title: 'Large Transaction', body: 'Rent payment of $1,450 was processed.', time: '6d ago', read: true, type: 'info' },
  { id: 'n4', title: 'Monthly Summary Ready', body: 'Your February 2026 summary is available.', time: '1w ago', read: true, type: 'info' },
];

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
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);
  const [goals, setGoals] = useState<SavingsGoal[]>(SEED_GOALS);
  const [bills, setBills] = useState<Bill[]>(SEED_BILLS);
  const [accounts, setAccounts] = useState<Account[]>(SEED_ACCOUNTS);
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);
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
      if (txns.length) setTransactions(txns);
      if (gs.length) setGoals(gs);
      if (bs.length) setBills(bs);
      if (accs.length) setAccounts(accs);
      if (notifs.length) setNotifications(notifs);
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const currentMonth = '2026-02';
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
