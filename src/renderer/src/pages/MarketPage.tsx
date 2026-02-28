import AppShell from '@/components/AppShell';
import { ShieldCheck } from 'lucide-react';

export default function MarketPage() {
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-full bg-[#f2f4f7] flex items-center justify-center text-[#667085] mb-6">
                    <ShieldCheck size={32} />
                </div>

                <h1 className="text-2xl font-bold text-[#101828] mb-2">Market Overview</h1>
                <p className="text-[#667085] max-w-md mx-auto">
                    Deep insights into global markets, sector performance, and macroeconomic indicators. This feature is currently in development.
                </p>
            </div>
        </AppShell>
    );
}
