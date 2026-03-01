import { motion } from 'framer-motion';
import { Bell, AlertCircle, CheckCircle2, Info, Check } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useFinance } from '@/context/FinanceContext';

const iconMap = { alert: AlertCircle, success: CheckCircle2, info: Info };
const colorMap = { alert: 'var(--accent-red)', success: 'var(--accent-green)', info: 'var(--accent-blue)' };
const bgMap = { alert: 'rgba(248,113,113,0.1)', success: 'rgba(34,197,94,0.1)', info: 'rgba(96,165,250,0.1)' };

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useFinance();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</h2>
          {unread > 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-black/5"
            style={{ color: 'var(--accent-blue)', border: '1px solid rgba(96,165,250,0.2)' }}>
            <Check size={13} /> Mark all read
          </button>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card p-5">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No notifications</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n, i) => {
              const Icon = iconMap[n.type];
              const color = colorMap[n.type];
              return (
                <motion.div key={n.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: n.read ? 'transparent' : 'var(--bg-card-hover)',
                    border: `1px solid ${n.read ? 'var(--border)' : 'var(--border-light)'}`,
                    opacity: n.read ? 0.6 : 1,
                  }}
                  onClick={() => markNotificationRead(n.id)}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: bgMap[n.type], border: `1px solid ${color}30` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</span>
                      {!n.read && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-brand)' }} />}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.body}</p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>{n.time}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
