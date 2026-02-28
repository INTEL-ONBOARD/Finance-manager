import AppShell from '@/components/AppShell';
import FloatingAIChat from '@/components/FloatingAIChat';
import { Sparkles, BotMessageSquare } from 'lucide-react';

export default function AIChatPage() {
    return (
        <AppShell>
            <div className="flex flex-col items-center justify-center h-full p-8 gap-6 max-w-3xl mx-auto w-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#84cc16] to-[#65a30d] flex items-center justify-center shadow-lg text-white mb-4">
                    <BotMessageSquare size={32} />
                </div>

                <h1 className="text-3xl font-bold text-[#101828]">Hi, I'm FinMate AI</h1>
                <p className="text-[#667085] text-lg leading-relaxed max-w-xl">
                    I can analyze your portfolio, find emerging market trends, break down complex earnings calls, or answer any financial questions you have.
                </p>

                <div className="grid grid-cols-2 gap-4 w-full mt-8">
                    {[
                        "What are the top gaining stocks under $20 today?",
                        "Summarize Nvidia's latest earnings report.",
                        "Analyze my portfolio risk based on current market volatility.",
                        "How do new inflation numbers affect the S&P 500?"
                    ].map((prompt, i) => (
                        <button key={i} className="text-left bg-white border border-[#eaecf0] hover:border-[#84cc16] p-4 rounded-xl shadow-sm transition-all group flex items-start gap-3">
                            <Sparkles className="text-[#84cc16] shrink-0 mt-0.5" size={16} />
                            <span className="text-[#344054] font-medium text-[14px] leading-snug group-hover:text-[#101828]">{prompt}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* The Floating AI chat component actually gets used here globally anyway */}
            <FloatingAIChat />
        </AppShell>
    );
}
