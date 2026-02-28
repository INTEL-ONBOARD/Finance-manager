import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, AlertCircle, CheckCircle2, Info, LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';

const ROUTE_LABELS: Record<string, string> = {
  '/':             'Dashboard',
  '/accounts':     'Accounts',
  '/transactions': 'Transactions',
  '/budget':       'Budget',
  '/goals':        'Goals',
  '/bills':        'Bills',
  '/investments':  'Investments',
  '/notifications':'Notifications',
  '/settings':     'Settings',
  '/help':         'Help',
  '/ai-chat':      'AI Chat',
  '/market':       'Market',
  '/portfolio':    'Portfolio',
  '/predictions':  'Predictions',
  '/exchanges':    'Exchanges',
  '/community':    'Community',
};

const SEARCH_LINKS = [
  { label: 'Overview', href: '/' },
  { label: 'Transactions', href: '/transactions' },
  { label: 'Budget', href: '/budget' },
  { label: 'Goals', href: '/goals' },
  { label: 'Bills', href: '/bills' },
  { label: 'Investments', href: '/investments' },
  { label: 'Accounts', href: '/accounts' },
  { label: 'Settings', href: '/settings' },
];

const iconMap = {
  alert:   { Icon: AlertCircle,  color: '#ef4444' },
  success: { Icon: CheckCircle2, color: '#22c55e' },
  info:    { Icon: Info,         color: '#3b82f6' },
} as const;

export default function Topbar() {
  const { unreadNotificationCount, notifications, markNotificationRead, markAllNotificationsRead } = useFinance();
  const { logout, user } = useAuth();
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';
  const navigate = useNavigate();
  const location = useLocation();
  const pageLabel = ROUTE_LABELS[location.pathname] ?? 'Page';
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const results = query.trim()
    ? SEARCH_LINKS.filter(l => l.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-between px-8 py-5 shrink-0"
      style={{ background: 'transparent', WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>Home</span>
        <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>›</span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{pageLabel}</span>
      </div>

      <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Search */}
        <div ref={ref} className="relative w-72">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search anything"
              className="flex-1 bg-transparent border-none outline-none font-medium"
              style={{ fontSize: 13, color: 'var(--text-primary)', caretColor: 'var(--accent-brand)' }}
            />
          </div>
          <AnimatePresence>
            {open && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute top-full mt-1 left-0 right-0 rounded-xl overflow-hidden z-50"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
              >
                {results.map(r => (
                  <Link key={r.href} to={r.href}
                    onClick={() => { setOpen(false); setQuery(''); }}
                    className="flex items-center px-4 py-2.5 transition-colors hover:bg-[var(--bg-card)]/5"
                    style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none', display: 'flex' }}>
                    {r.label}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
            {/* Bell + Notification Dropdown */}
            <div ref={notifRef} className="relative flex items-center">
              <button
                onClick={() => setNotifOpen(p => !p)}
                className="relative transition-colors rounded-full p-0.5"
              style={{ color: 'var(--text-muted)' }}
              >
                <Bell size={18} strokeWidth={1.5} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-4 w-80 z-50 overflow-hidden"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                      borderRadius: 14,
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                          Notifications
                        </span>
                        {unreadNotificationCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: '#ef4444', color: '#fff', lineHeight: 1.4 }}>
                            {unreadNotificationCount}
                          </span>
                        )}
                      </div>
                      {unreadNotificationCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="transition-colors"
                          style={{ fontSize: 11.5, color: 'var(--accent-brand)', fontWeight: 500 }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-85 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center"
                          style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          No notifications
                        </div>
                      ) : (
                        notifications.map((n, i) => {
                          const { Icon, color } = iconMap[n.type] ?? iconMap.info;
                          return (
                            <button
                              key={n.id}
                              onClick={() => markNotificationRead(n.id)}
                              className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/3"
                              style={{
                                opacity: n.read ? 0.5 : 1,
                                borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                              }}
                            >
                              <div className="mt-0.5 shrink-0">
                                <Icon size={15} style={{ color }} strokeWidth={2} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 justify-between">
                                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}
                                    className="truncate">
                                    {n.title}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.time}</span>
                                    {!n.read && (
                                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ background: '#3b82f6' }} />
                                    )}
                                  </div>
                                </div>
                                <p className="mt-0.5 leading-snug"
                                  style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                                  {n.body}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="flex items-center justify-center py-2.5 transition-colors hover:bg-white/3"
                        style={{ fontSize: 12.5, color: 'var(--accent-brand)', fontWeight: 500, textDecoration: 'none' }}
                      >
                        View all notifications →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Log out"
              className="flex items-center transition-colors rounded-full p-0.5"
            style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={17} strokeWidth={1.5} />
            </button>

            {/* User avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border shrink-0"
              style={{ background: 'var(--accent-brand)', color: '#fff', borderColor: 'var(--border-light)' }}>
              <div className="text-[13px] font-semibold" style={{ letterSpacing: '0.02em' }}>{initials}</div>
            </div>
        </div>
      </div>
    </motion.header>
  );
}
