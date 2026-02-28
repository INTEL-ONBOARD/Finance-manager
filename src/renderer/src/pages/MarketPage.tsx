import AppShell from '@/components/AppShell';
import { ShieldCheck } from 'lucide-react';

export default function MarketPage() {
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                    <ShieldCheck size={32} />
                </div>

                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Market Overview</h1>
                <p className="max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                    Deep insights into global markets, sector performance, and macroeconomic indicators. This feature is currently in development.
                </p>
            </div>
        </AppShell>
    );
}
