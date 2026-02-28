import AppShell from '@/components/AppShell';
import { Clock } from 'lucide-react';

export default function PortfolioPage() {
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-full bg-[#f2f4f7] flex items-center justify-center text-[#667085] mb-6">
                    <Clock size={32} />
                </div>

                <h1 className="text-2xl font-bold text-[#101828] mb-2">Portfolio Analytics</h1>
                <p className="text-[#667085] max-w-md mx-auto">
                    Track your performance, analyze risk, and compare your returns against major benchmarks. Coming soon.
                </p>
            </div>
        </AppShell>
    );
}
