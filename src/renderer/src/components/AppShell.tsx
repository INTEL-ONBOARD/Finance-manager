import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children, fullBleed }: { children: React.ReactNode; fullBleed?: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
        <main className={`flex-1 w-full ${fullBleed ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <div className={`${fullBleed ? 'h-full overflow-hidden' : 'p-8 flex flex-col gap-6'} w-full relative`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
