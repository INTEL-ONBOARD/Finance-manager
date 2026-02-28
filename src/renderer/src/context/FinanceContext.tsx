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
  addNotification: (n: Omit<Notification, 'read'>) => void;
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

function buildNotifications(
  bills: Bill[],
  goals: SavingsGoal[],
  transactions: Transaction[],
  existingIds: Set<string>
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
      results.push({ id, title: `${bill.name} is overdue!`, body: `$${bill.amount} was due on the ${bill.dueDay}th.`, time: 'Just now', type: 'alert' });
    } else if (daysUntil === 0) {
      results.push({ id, title: `${bill.name} due today`, body: `$${bill.amount} is due today.`, time: 'Just now', type: 'alert' });
    } else if (daysUntil <= 3) {
      results.push({ id, title: `${bill.name} due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`, body: `$${bill.amount} is due on the ${bill.dueDay}th.`, time: 'Just now', type: 'alert' });
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
            ? `You've hit your $${goal.target.toLocaleString()} target!`
            : `$${goal.current.toLocaleString()} of $${goal.target.toLocaleString()} saved.`,
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
      body: `$${Math.abs(txn.amount).toLocaleString()} ${txn.amount < 0 ? 'expense' : 'income'} on ${txn.account}.`,
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

  // Re-hydrate whenever the logged-in user changes
  useEffect(() => {
    if (!userId || typeof window === 'undefined' || !window.electron?.db) {
      setTransactions([]);
      setGoals([]);
      setBills([]);
      setAccounts([]);
      setNotifications([]);
      return;
    }
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
      const generated = buildNotifications(bs as Bill[], gs as SavingsGoal[], txns as Transaction[], existingIds);
      for (const n of generated) {
        const doc: Notification = { ...n, read: false };
        setNotifications(prev => prev.some(x => x.id === doc.id) ? prev : [doc, ...prev]);
        window.electron?.db.notifications.add(userId, doc);
      }
    }).catch(console.error);
  }, [userId]);

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
  const addNotification = useCallback((n: Omit<Notification, 'read'>) => {
    if (!userId) return;
    const doc: Notification = { ...n, read: false };
    setNotifications(prev => {
      if (prev.some(x => x.id === doc.id)) return prev;
      return [doc, ...prev];
    });
    window.electron?.db.notifications.add(userId, doc);
  }, [userId]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    if (!userId) return;
    const newDoc: Transaction = { ...t, id: `t${Date.now()}` };
    setTransactions(prev => [newDoc, ...prev]);
    window.electron?.db.transactions.add(userId, newDoc);
    if (Math.abs(t.amount) >= 500) {
      addNotification({
        id: `notif_txn_large_${newDoc.id}`,
        title: `Large transaction: ${newDoc.name}`,
        body: `$${Math.abs(newDoc.amount).toLocaleString()} ${newDoc.amount < 0 ? 'expense' : 'income'} on ${newDoc.account}.`,
        time: 'Just now',
        type: newDoc.amount < 0 ? 'alert' : 'success',
      });
    }
  }, [userId, addNotification]);

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
                ? `You've hit your $${updated.target.toLocaleString()} target!`
                : `$${updated.current.toLocaleString()} of $${updated.target.toLocaleString()} saved.`,
              time: 'Just now',
              type: 'success',
            });
          }
        }
      }
    }
  }, [userId, goals, notifications, addNotification]);

  const deleteGoal = useCallback((id: string) => {
    if (!userId) return;
    setGoals(prev => prev.filter(g => g.id !== id));
    window.electron?.db.goals.delete(userId, id);
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

  return (
    <FinanceContext.Provider value={{
      transactions, goals, bills, accounts, notifications,
      addTransaction, deleteTransaction,
      addGoal, updateGoal, deleteGoal,
      toggleBillPaid,
      markNotificationRead, markAllNotificationsRead, addNotification,
      totalBalance, netWorth, monthlyIncome, monthlyExpenses,
      monthlySaved, savingsRate, creditUtilization,
      unreadNotificationCount,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}
