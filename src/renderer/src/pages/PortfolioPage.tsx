import { Clock } from 'lucide-react';

export default function PortfolioPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                    <Clock size={32} />
                </div>

                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Portfolio Analytics</h1>
                <p className="max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                    Track your performance, analyze risk, and compare your returns against major benchmarks. Coming soon.
                </p>
        </div>
    );
}
