import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, Book, HelpCircle } from 'lucide-react';
const faqs = [
  { q: 'How do I add a transaction?', a: 'Click "+ Add" on the Transactions page or use the Overview dashboard. Fill in the description, amount, category, and account.' },
  { q: 'How do I create a savings goal?', a: 'Go to Goals in the sidebar and click "New Goal". Set a target amount and deadline, then track your progress.' },
  { q: 'How is net worth calculated?', a: 'Net worth = Total Assets (checking + savings + investments) minus Total Liabilities (credit card balance).' },
  { q: 'Can I delete a transaction?', a: 'Yes — click any transaction to open its details, then press the Delete button.' },
  { q: 'How do I mark a bill as paid?', a: 'Go to the Bills page and click the clock icon next to any bill to toggle its paid status.' },
  { q: 'How do I update progress on a goal?', a: 'Open the Goals page, click the edit (pencil) icon next to the current amount, enter the new value, and press Enter.' },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--accent-brand-dim)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <HelpCircle size={18} style={{ color: 'var(--accent-brand)' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Help Center</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Find answers and learn how to use FinMate</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Book,          label: 'Getting Started',   desc: 'Set up your accounts and goals' },
          { icon: MessageCircle, label: 'Contact Support',   desc: 'Get help from our team' },
          { icon: ChevronDown,   label: 'Video Tutorials',   desc: 'Step-by-step walkthroughs' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card p-4 cursor-pointer flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-light)' }}>
              <item.icon size={15} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card p-5">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Frequently Asked Questions</h3>
        <div className="flex flex-col">
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <button className="w-full flex items-center justify-between py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{faq.q}</span>
                <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }}
                  style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 12 }}>
                  <ChevronDown size={15} />
                </motion.span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, paddingBottom: 16 }}>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
