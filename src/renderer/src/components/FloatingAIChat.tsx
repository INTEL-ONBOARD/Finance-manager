import { Mic, Sparkles, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FloatingAIChat() {
    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: 'spring', damping: 20 }}
            className="fixed bottom-[30px] left-[50%] ml-[130px] translate-x-[-50%] z-50 flex flex-col items-center"
        // ml-[130px] helps offset the fixed sidebar (which is 260px wide) so it stays centered in main content
        >
            <div className="flex items-center gap-2 mb-2 w-[420px] justify-between">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-card)] rounded-full border border-[var(--border)] shadow-sm hover:bg-[var(--bg-primary)] transition-colors">
                    <Sparkles size={14} className="text-[var(--text-primary)]" />
                    <span className="text-[13px] font-bold text-[var(--text-primary)]">Think Bigger</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)] ml-1"><path d="m6 9 6 6 6-6" /></svg>
                </button>

                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-card)] rounded-full border border-[var(--border)] shadow-sm hover:bg-[var(--bg-primary)] transition-colors">
                    <div className="w-4 h-4 rounded-full bg-[#f97316] flex items-center justify-center">
                        <Sparkles size={10} className="text-white" />
                    </div>
                    <span className="text-[13px] font-bold text-[var(--text-primary)]">Claude Sonnet 4</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)] ml-1"><path d="m6 9 6 6 6-6" /></svg>
                </button>
            </div>

            <div className="w-[420px] bg-[var(--bg-card)] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--border)] p-2 flex items-center">
                <input
                    type="text"
                    placeholder="Ask any question"
                    className="flex-1 bg-transparent border-none outline-none pl-4 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] font-medium"
                />

                <div className="flex items-center gap-2 pr-1">
                    <button className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)] rounded-full transition-colors">
                        <span className="text-xl leading-none font-light">+</span>
                    </button>

                    <div className="w-[1px] h-5 bg-[var(--border)]" />

                    <button className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-light)] rounded-full transition-colors">
                        <Mic size={18} />
                    </button>

                    <button className="w-8 h-8 flex items-center justify-center bg-[#84cc16] hover:bg-[#65a30d] text-white rounded-full transition-colors shadow-sm ml-1">
                        <ArrowUp size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
