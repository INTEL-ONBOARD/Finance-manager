import AppShell from '@/components/AppShell';
import { Target, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PredictionsPage() {
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center h-full text-center p-8 relative">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#f9fafb] border border-[#eaecf0] shadow-sm flex items-center justify-center text-[#84cc16] mb-6 relative">
                        <Target size={32} />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-[#eaecf0] rounded-full flex items-center justify-center shadow-sm">
                            <Lock size={12} className="text-[#667085]" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-[#101828] mb-2 flex items-center gap-2">
                        AI Predictions <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-[#84cc16] tracking-wide">PRO</span>
                    </h1>
                    <p className="text-[#667085] max-w-md mx-auto mb-8">
                        Unlock advanced machine learning models forecasting market movements, sector rotations, and individual asset performance.
                    </p>

                    <Link to="/settings" className="px-6 py-2.5 bg-[#101828] hover:bg-[#1d2939] text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer text-sm">
                        Upgrade to Pro
                    </Link>
                </div>
            </div>
        </AppShell>
    );
}
