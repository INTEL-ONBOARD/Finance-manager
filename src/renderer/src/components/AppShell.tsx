import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useFinance } from '@/context/FinanceContext';

export default function AppShell({ children, fullBleed }: { children: React.ReactNode; fullBleed?: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { dbError } = useFinance();
  const [errorDismissed, setErrorDismissed] = useState(false);

  // Load persisted theme and apply to <html>
  useEffect(() => {
    const saved = localStorage.getItem('finmate-theme') as 'light' | 'dark' | null;
    const initial = saved ?? 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('finmate-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      // Also persist to electron-store so the main process can read it on next launch
      // (used to set the correct window backgroundColor before the renderer paints)
      window.electron?.store.set('finmate-theme', next);
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar
        theme={theme}
        onThemeToggle={toggleTheme}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        {dbError && !errorDismissed && (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            borderBottom: '1px solid rgba(239,68,68,0.3)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, color: '#f87171' }}>{dbError}</span>
            <button
              onClick={() => setErrorDismissed(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 16, lineHeight: 1, padding: 0 }}
              aria-label="Dismiss"
            >×</button>
          </div>
        )}
        <main className={`flex-1 w-full ${fullBleed ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <div className={`${fullBleed ? 'h-full overflow-hidden' : 'p-8 flex flex-col gap-6'} w-full relative`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
