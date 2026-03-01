import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, LayoutDashboard, ArrowLeftRight, PiggyBank, Target, Sparkles } from 'lucide-react';

const SLIDES = [
  {
    icon: LayoutDashboard,
    color: '#84cc16',
    title: 'Your Dashboard',
    body: "Get a bird's-eye view of your finances — income, expenses, net worth, and savings at a glance.",
  },
  {
    icon: ArrowLeftRight,
    color: '#3b82f6',
    title: 'Transactions',
    body: 'Log every income and expense. Filter, search, and see where your money actually goes.',
  },
  {
    icon: PiggyBank,
    color: '#f59e0b',
    title: 'Budget & Bills',
    body: "Set spending limits per category and track recurring bills so nothing slips through the cracks.",
  },
  {
    icon: Target,
    color: '#a855f7',
    title: 'Savings Goals',
    body: 'Define goals with deadlines. Watch your progress bars fill as you contribute over time.',
  },
  {
    icon: Sparkles,
    color: '#14b8a6',
    title: 'AI Assistant',
    body: 'Ask your AI chat anything — spending breakdowns, saving advice, or financial Q&A.',
  },
];

interface StepTourProps {
  onFinish: () => void;
}

export default function StepTour({ onFinish }: StepTourProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const slide = SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;

  const go = (dir: number) => {
    setDirection(dir);
    setIndex(i => i + dir);
  };

  const finish = () => {
    localStorage.setItem('finmate-onboarded', 'true');
    onFinish();
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4, textAlign: 'center' }}>
          Here's what you can do
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center' }}>
          A quick tour of the key features.
        </p>
      </div>

      {/* Slide card */}
      <div style={{ width: '100%', maxWidth: 400, minHeight: 220, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-col items-center text-center gap-5 p-8 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: `${slide.color}20`,
              border: `1.5px solid ${slide.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={28} style={{ color: slide.color }} />
            </div>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                {slide.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {slide.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
            style={{
              width: i === index ? 20 : 8,
              height: 8, borderRadius: 4,
              background: i === index ? 'var(--accent-brand)' : 'var(--border)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.2s',
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 w-full" style={{ maxWidth: 400 }}>
        {index > 0 && (
          <button
            onClick={() => go(-1)}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl transition-all hover:bg-black/5"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>
            <ArrowLeft size={15} /> Prev
          </button>
        )}
        {!isLast ? (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => go(1)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold"
            style={{
              background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))',
              color: 'white', fontSize: 13,
              border: 'none', cursor: 'pointer',
            }}>
            Next <ArrowRight size={15} />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={finish}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold"
            style={{
              background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))',
              color: 'white', fontSize: 13,
              boxShadow: '0 4px 14px rgba(132,204,22,0.3)',
              border: 'none', cursor: 'pointer',
            }}>
            Go to Dashboard <ArrowRight size={15} />
          </motion.button>
        )}
      </div>
    </div>
  );
}
