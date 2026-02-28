import AppShell from '@/components/AppShell';
import { Users } from 'lucide-react';

export default function CommunityPage() {
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                    <Users size={32} />
                </div>

                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Community Insights</h1>
                <p className="max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                    Discuss trades, share portfolio strategies, and learn from top performers. Community features will be rolling out soon.
                </p>
            </div>
        </AppShell>
    );
}
