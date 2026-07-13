import { BotMessageSquare } from 'lucide-react';

export default function AIChatPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
                <BotMessageSquare size={32} />
            </div>

            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>FinMate AI</h1>
            <p className="max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                A conversational assistant for your portfolio, market trends, and earnings analysis. This feature is currently in development.
            </p>
        </div>
    );
}
