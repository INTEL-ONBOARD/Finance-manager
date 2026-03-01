import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Wallet, CreditCard, PieChart, Target, CalendarDays, TrendingUp,
  Users, Settings, HelpCircle, Sun, Moon,
  ChevronDown, ChevronRight, Crown, Hexagon, Bell,
  PanelLeft
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

const navItems = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Accounts', href: '/accounts', icon: Wallet },
  { label: 'Transactions', href: '/transactions', icon: CreditCard },
  { label: 'Budget', href: '/budget', icon: PieChart },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'Bills', href: '/bills', icon: CalendarDays },
];

const bottomItems = [
  { label: 'Community', href: '/community', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ theme, onThemeToggle, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { pathname } = useLocation();
  const { unreadNotificationCount } = useFinance();
  const [expandedItem, setExpandedItem] = useState('Home');

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <motion.aside
      initial={{ width: 240, opacity: 0 }}
      animate={{ width: isCollapsed ? 80 : 240, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="shrink-0 flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
    >
      {/* macOS Traffic Lights drag region */}
      <div className="w-full h-8 shrink-0" style={{ WebkitAppRegion: 'drag' } as any} />

      {/* Logo */}
      <div className={`flex ${isCollapsed ? 'flex-col items-center gap-4' : 'items-center gap-3'} px-5 pb-6 pt-2 shrink-0`}>
        <div className="w-9 h-9 shrink-0 rounded-[10px] flex items-center justify-center bg-[#84cc16] shadow-sm">
          <Hexagon size={20} className="text-white fill-white" />
        </div>
        {!isCollapsed && (
          <span className="whitespace-nowrap" style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 19, letterSpacing: '-0.01em' }}>FinMate</span>
        )}
        <button onClick={onToggleCollapse} className={`transition-colors ${isCollapsed ? '' : 'ml-auto'}`} style={{ color: 'var(--text-muted)', WebkitAppRegion: 'no-drag' } as any}>
          <PanelLeft size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              to={item.href}
              className={`w-full flex items-center px-3 py-3 rounded-xl mb-0.5 transition-all duration-150 hover:bg-[var(--bg-card)]/5 ${isCollapsed ? 'justify-center' : 'gap-3'}`}
              style={{
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                display: 'flex',
                textDecoration: 'none',
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={18} strokeWidth={2} style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)', flexShrink: 0 }} />
              {!isCollapsed && (
                <span className="whitespace-nowrap" style={{ fontSize: 14, fontWeight: active ? 600 : 500 }}>{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        {bottomItems.map((item) => (
          <Link key={item.label} to={item.href}
            className={`w-full flex items-center px-3 py-3 rounded-xl mb-0.5 transition-all duration-150 hover:bg-[var(--bg-card)]/5 relative ${isCollapsed ? 'justify-center' : 'gap-3'}`}
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex' }}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span className="whitespace-nowrap" style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>}
          </Link>
        ))}

        {/* Theme toggle */}
        {!isCollapsed && (
          <div className="mx-2 mt-4 flex rounded-xl p-1" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            {(['light', 'dark'] as const).map((t) => (
              <button key={t} onClick={() => theme !== t && onThemeToggle()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg transition-all duration-200"
                style={{
                  background: theme === t ? 'var(--bg-modal)' : 'transparent',
                  boxShadow: theme === t ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  color: theme === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 600, padding: '7px 0',
                }}>
                {t === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Upgrade */}
        {!isCollapsed && (
          <div className="mx-2 mt-4 p-5 rounded-[16px] relative overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>Upgrade Your Plan</span>
              <div className="w-4 h-4 rounded-full bg-[#84cc16] flex items-center justify-center">
                <Crown size={10} strokeWidth={3} className="text-white" />
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
              Enjoy increased limits, premium tools, and priority support when you upgrade.
            </p>
            <Link to="/settings"
              className="block w-full py-2.5 rounded-lg text-[13px] font-bold text-center transition-all duration-200 shadow-sm"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', textDecoration: 'none', border: '1px solid var(--border)' }}>
              Upgrade Now
            </Link>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
