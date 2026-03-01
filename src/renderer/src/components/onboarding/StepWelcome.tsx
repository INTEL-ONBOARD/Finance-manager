import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface StepWelcomeProps {
  name: string;
  avatar?: string;
  onNext: () => void;
}

export default function StepWelcome({ name, avatar, onNext }: StepWelcomeProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center text-center gap-6">
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-brand)' }}
          />
        ) : (
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'var(--accent-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, fontWeight: 800, color: 'white',
          }}>
            {initial}
          </div>
        )}
      </motion.div>

      {/* Heading */}
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          Welcome, {name}!
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 360 }}>
          Let's get your finances set up. We'll add your accounts, log some transactions, and show you around.
        </p>
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNext}
        className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold mt-2 transition-all"
        style={{
          background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))',
          color: 'white',
          fontSize: 15,
          boxShadow: '0 4px 14px rgba(132,204,22,0.25)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Let's get started
        <ArrowRight size={18} />
      </motion.button>
    </div>
  );
}
