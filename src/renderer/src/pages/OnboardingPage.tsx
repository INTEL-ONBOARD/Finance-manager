import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Hexagon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import StepWelcome from '@/components/onboarding/StepWelcome';
import StepAddAccount from '@/components/onboarding/StepAddAccount';
import StepAddTransactions from '@/components/onboarding/StepAddTransactions';
import StepTour from '@/components/onboarding/StepTour';

const STEP_LABELS = ['Welcome', 'Add Account', 'Transactions', 'App Tour'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (localStorage.getItem('finwise-onboarded') !== 'false') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const next = () => goTo(step + 1);
  const back = () => goTo(step - 1);
  const finish = () => navigate('/');

  return (
    <div className="flex min-h-screen w-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Left panel — same style as RegisterPage */}
      <div
        className="hidden lg:flex w-2/5 relative overflow-hidden items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #1a2a0a 0%, #1e3a10 40%, #0f2208 100%)',
          borderRight: '1px solid rgba(0,0,0,0.15)',
        }}
      >
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #84cc16 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(132,204,22,0.18) 0%, transparent 70%)',
        }} />
        <div className="relative z-10 flex flex-col items-center text-center p-12 gap-6">
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: '#84cc16',
            boxShadow: '0 8px 32px rgba(132,204,22,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Hexagon size={40} className="text-white fill-white" />
          </div>
          <div>
            <h1 style={{ color: '#f1f5f9', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>
              Setting up <br /><span style={{ color: '#84cc16' }}>your profile</span>
            </h1>
            <p style={{ color: 'rgba(241,245,249,0.55)', fontSize: 15, lineHeight: 1.6 }}>
              Just a few steps to get your financial dashboard ready.
            </p>
          </div>
          {/* Step list */}
          <div className="flex flex-col gap-2 w-full mt-4">
            {STEP_LABELS.map((label, i) => {
              const s = i + 1;
              const done = step > s;
              const active = step === s;
              return (
                <div key={s} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ background: active ? 'rgba(132,204,22,0.12)' : 'transparent', border: active ? '1px solid rgba(132,204,22,0.2)' : '1px solid transparent' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: done ? '#84cc16' : active ? 'rgba(132,204,22,0.3)' : 'rgba(255,255,255,0.1)',
                    border: done || active ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    color: done || active ? 'white' : 'rgba(255,255,255,0.4)',
                    flexShrink: 0,
                  }}>
                    {done ? '✓' : s}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#84cc16' : done ? 'rgba(241,245,249,0.7)' : 'rgba(241,245,249,0.35)' }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative overflow-hidden">
        {/* Progress dots (mobile + desktop) */}
        {step > 1 && step < 4 && (
          <div className="flex items-center gap-2 mb-8 self-start">
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{
                width: step >= s ? 20 : 8, height: 8, borderRadius: 4,
                background: step >= s ? 'var(--accent-brand)' : 'var(--border)',
                transition: 'all 0.2s',
              }} />
            ))}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
              Step {step} of 4 — {STEP_LABELS[step - 1]}
            </span>
          </div>
        )}

        {/* Step content with slide animation */}
        <div className="w-full max-w-lg overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? 30 : -30, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d > 0 ? -30 : 30, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 1 && (
                <StepWelcome
                  name={user?.name ?? 'there'}
                  avatar={user?.avatar}
                  onNext={next}
                />
              )}
              {step === 2 && (
                <StepAddAccount onNext={next} onSkip={next} onBack={back} />
              )}
              {step === 3 && (
                <StepAddTransactions onNext={next} onSkip={next} onBack={back} />
              )}
              {step === 4 && (
                <StepTour onFinish={finish} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
