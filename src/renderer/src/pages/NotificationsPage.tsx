import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertCircle, CheckCircle2, Info, Check, Trash2, BellOff } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

const TYPE_CONFIG = {
  alert:   { icon: AlertCircle,   color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)',  label: 'Alert'   },
  success: { icon: CheckCircle2,  color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.2)',   label: 'Success' },
  info:    { icon: Info,          color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.2)',   label: 'Info'    },
};

type FilterTab = 'all' | 'unread' | 'alert' | 'success' | 'info';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'unread',  label: 'Unread'  },
  { key: 'alert',   label: 'Alerts'  },
  { key: 'success', label: 'Updates' },
  { key: 'info',    label: 'Info'    },
];

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useFinance();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Notifications
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={markAllNotificationsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
            style={{
              fontSize: 13, color: '#60a5fa',
              background: 'rgba(96,165,250,0.08)',
              border: '1px solid rgba(96,165,250,0.2)',
              cursor: 'pointer',
            }}>
            <Check size={14} /> Mark all read
          </motion.button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',   value: notifications.length,                                   color: 'var(--text-primary)' },
          { label: 'Unread',  value: unreadCount,                                             color: '#60a5fa'             },
          { label: 'Alerts',  value: notifications.filter(n => n.type === 'alert').length,    color: '#f87171'             },
        ].map(stat => (
          <div key={stat.label} className="card p-4 flex flex-col gap-1">
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {stat.label}
            </span>
            <span style={{ fontSize: 28, fontWeight: 800, color: stat.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', width: 'fit-content' }}>
        {TABS.map(tab => {
          const count = tab.key === 'all'    ? notifications.length
                      : tab.key === 'unread' ? unreadCount
                      : notifications.filter(n => n.type === tab.key).length;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
              style={{
                fontSize: 12, fontWeight: active ? 700 : 500,
                color: active ? 'white' : 'var(--text-secondary)',
                background: active ? 'var(--accent-brand)' : 'transparent',
                border: 'none', cursor: 'pointer',
              }}>
              {tab.label}
              {count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, lineHeight: 1,
                  padding: '1px 5px', borderRadius: 6,
                  background: active ? 'rgba(255,255,255,0.25)' : 'var(--bg-primary)',
                  color: active ? 'white' : 'var(--text-muted)',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="card flex flex-col items-center justify-center py-16 gap-4"
            >
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BellOff size={24} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Nothing here</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {activeTab === 'unread' ? 'No unread notifications.' : 'No notifications in this category.'}
                </p>
              </div>
            </motion.div>
          ) : (
            filtered.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => markNotificationRead(n.id)}
                  className="card flex items-start gap-4 cursor-pointer transition-all"
                  style={{
                    padding: '16px 20px',
                    opacity: n.read ? 0.55 : 1,
                    borderLeft: !n.read ? `3px solid ${cfg.color}` : '3px solid transparent',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</span>
                      {!n.read && (
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: 'var(--accent-brand)', flexShrink: 0,
                          boxShadow: '0 0 6px rgba(132,204,22,0.5)',
                        }} />
                      )}
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
                        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                        marginLeft: 2,
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 6 }}>{n.body}</p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.time}</span>
                  </div>

                  {/* Read indicator */}
                  {n.read && (
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={11} style={{ color: '#4ade80' }} />
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
