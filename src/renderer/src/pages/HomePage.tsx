import AppShell from '@/components/AppShell';
import StatCards from '@/components/StatCards';
import TransactionsFeed from '@/components/TransactionsFeed';
import BudgetCard from '@/components/BudgetCard';
import NetWorthCard from '@/components/NetWorthCard';
import SavingsGoals from '@/components/SavingsGoals';
import SpendingAnalytics from '@/components/SpendingAnalytics';

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-4 pb-20 relative min-h-full">
        <StatCards />
        <div className="grid grid-cols-[2fr_1fr] gap-4 w-full items-stretch">
          <TransactionsFeed />
          <BudgetCard />
        </div>
        <NetWorthCard />
        <div className="grid grid-cols-[2fr_1.5fr] gap-4 w-full">
          <SavingsGoals />
          <SpendingAnalytics />
        </div>
      </div>
    </AppShell>
  );
}
