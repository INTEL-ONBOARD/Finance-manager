import { ArrowLeftRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const dotBg = {
    backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
    backgroundSize: '16px 16px',
};

export default function ExchangesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 relative">
                <div className="absolute inset-0 opacity-[0.04]" style={dotBg} />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#84cc16] mb-6 relative" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                        <ArrowLeftRight size={32} />
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
                            <Lock size={12} />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        Exchange Integrations <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-[#84cc16] tracking-wide">PRO</span>
                    </h1>
                    <p className="max-w-md mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
                        Directly connect and trade from your brokerages, auto-sync balances, and manage all your assets in one unified platform.
                    </p>

                    <Link to="/settings" className="px-6 py-2.5 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer text-sm" style={{ background: 'var(--text-primary)' }}>
                        Upgrade to Pro
                    </Link>
                </div>
            </div>
        </div>
    );
}
