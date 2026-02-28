import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon } from 'lucide-react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Apply the saved theme before AppShell mounts so CSS variables resolve correctly
    const saved = localStorage.getItem('finmate-theme') as 'light' | 'dark' | null;
    document.documentElement.setAttribute('data-theme', saved ?? 'dark');

    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setProgress(35), 0),
      setTimeout(() => setProgress(60), 320),
      setTimeout(() => setProgress(80), 700),
      setTimeout(() => setProgress(95), 1100),
      setTimeout(() => setProgress(100), 1500),
      setTimeout(() => setVisible(false), 1900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'var(--bg-primary)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 28,
          }}
        >
          {/* Logo mark + wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: '#84cc16',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Hexagon size={32} className="text-white fill-white" />
            </div>
            <span style={{
              fontFamily: 'Geist, -apple-system, sans-serif',
              fontWeight: 800,
              fontSize: 38,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>
              FinMate
            </span>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            style={{ width: 220 }}
          >
            <div style={{
              height: 3, borderRadius: 999,
              background: 'var(--accent-brand-dim)',
              overflow: 'hidden',
            }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  height: '100%', borderRadius: 999,
                  background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))',
                  boxShadow: '0 0 8px rgba(74,222,128,0.55)',
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
