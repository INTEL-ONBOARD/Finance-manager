import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, CreditCard, Crown, Check, ChevronRight,
  Camera, Lock, Smartphone, Trash2, Zap, BarChart3, Target, Receipt,
  RefreshCw, Download, CheckCircle, AlertCircle, ArrowUpCircle,
  Monitor, Eye, EyeOff, Clock,
} from 'lucide-react';
import AppShell from '@/components/AppShell';

const sections = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security',      label: 'Security',      icon: Shield },
  { id: 'billing',       label: 'Billing',       icon: CreditCard },
  { id: 'upgrade',       label: 'Upgrade',       icon: Crown },
  { id: 'updates',       label: 'Updates',       icon: Download },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'LKR', 'AUD', 'CAD', 'JPY', 'SGD'];
const TIMEZONES  = ['Asia/Colombo', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Australia/Sydney', 'Asia/Tokyo'];

interface Session {
  sessionId: string;
  userId: string;
  deviceLabel: string;
  createdAt: string;
  lastActiveAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { setCurrency } = useFinance();
  const [active, setActive] = useState('profile');

  // Profile
  const [profile, setProfile] = useState({
    name: user?.name ?? '', email: user?.email ?? '', currency: 'USD', timezone: 'Asia/Colombo',
  });
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  // Notifications
  const [notifs, setNotifs] = useState({
    systemNotifications: true, billReminders: true, goalProgress: true,
    largeTransactions: true, monthlyReport: true, weeklyDigest: false,
  });
  const notifSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup notifSaveTimer on unmount
  useEffect(() => {
    return () => { if (notifSaveTimer.current) clearTimeout(notifSaveTimer.current); };
  }, []);

  // Avatar
  const [avatarError, setAvatarError] = useState('');

  // Security — change password
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ old: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ old: false, newPw: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwDone, setPwDone] = useState(false);

  // Security — sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Security — danger zone
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearDone, setClearDone] = useState(false);

  // Updates
  type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'up-to-date';
  const [updateStatus,     setUpdateStatus]     = useState<UpdateStatus>('idle');
  const [updateInfo,       setUpdateInfo]       = useState<{ version: string; releaseNotes: string | null } | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateError,      setUpdateError]      = useState('');
  const [appVersion,       setAppVersion]       = useState('');

  // ── Load settings on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setProfileLoading(true);
    const p = window.electron?.db.settings?.get(user.id);
    if (p) {
      p.then(s => {
        if (cancelled) return;
        if (s) {
          setProfile({
            name:     (s as { name?: string }).name     ?? user.name,
            email:    (s as { email?: string }).email   ?? user.email,
            currency: (s as { currency?: string }).currency ?? 'USD',
            timezone: (s as { timezone?: string }).timezone ?? 'Asia/Colombo',
          });
          const n = (s as { notifs?: typeof notifs }).notifs;
          if (n) setNotifs(prev => ({ ...prev, ...n }));
          const av = (s as { avatar?: string }).avatar;
          if (av) updateUser({ avatar: av });
        }
      }).finally(() => { if (!cancelled) setProfileLoading(false); });
    } else {
      setProfileLoading(false);
    }
    return () => { cancelled = true; };
  }, [user?.id]);

  // ── Load sessions when on security tab ───────────────────────────────────────
  useEffect(() => {
    if (active !== 'security' || !user) return;
    setSessionsLoading(true);
    const sp = window.electron?.db.sessions?.list(user.id);
    if (sp) {
      sp.then(list => setSessions((list ?? []) as Session[]))
        .finally(() => setSessionsLoading(false));
    } else {
      setSessionsLoading(false);
    }
  }, [active, user?.id]);

  // ── Updater listeners ─────────────────────────────────────────────────────────
  useEffect(() => {
    window.electron?.getVersion().then(setAppVersion);
    if (!window.electron?.updater) return;
    const cleanups = [
      window.electron.updater.onChecking(()    => setUpdateStatus('checking')),
      window.electron.updater.onAvailable((i)  => { setUpdateInfo(i); setUpdateStatus('available'); }),
      window.electron.updater.onNotAvailable(() => setUpdateStatus('up-to-date')),
      window.electron.updater.onProgress((p)   => { setDownloadProgress(p.percent); setUpdateStatus('downloading'); }),
      window.electron.updater.onDownloaded(()   => setUpdateStatus('downloaded')),
      window.electron.updater.onError((msg)    => { setUpdateError(msg); setUpdateStatus('error'); }),
    ];
    return () => cleanups.forEach(fn => fn());
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setSaveError('');
    const settings = { name: profile.name, email: profile.email, currency: profile.currency, timezone: profile.timezone, notifs };
    try {
      await window.electron?.db.settings?.save(user.id, settings);
      updateUser({ name: profile.name, email: profile.email });
      setCurrency(profile.currency);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch {
      setSaveError('Failed to save. Please try again.');
    }
  };

  const handleAvatarClick = async () => {
    if (!user) return;
    setAvatarError('');
    try {
      const filePath = await window.electron?.dialog?.openImage();
      if (!filePath) return;
      const result = await window.electron?.db.user?.avatar.save(user.id, filePath);
      if (!result) return;
      if (!result.ok) {
        setAvatarError(result.error ?? 'Failed to upload photo.');
        return;
      }
      if (result.avatar) updateUser({ avatar: result.avatar });
    } catch {
      setAvatarError('Failed to upload photo. Please try again.');
    }
  };

  const handleToggle = (key: keyof typeof notifs) => {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    if (!user) return;
    if (notifSaveTimer.current) clearTimeout(notifSaveTimer.current);
    const userId = user.id;
    notifSaveTimer.current = setTimeout(() => {
      // Use profileRef to always capture the latest profile at save time
      const p = profileRef.current;
      window.electron?.db.settings?.save(userId, {
        name: p.name, email: p.email, currency: p.currency, timezone: p.timezone, notifs: updated,
      });
    }, 500);
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (pwForm.newPw.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.newPw === pwForm.old) { setPwError('New password must differ from current password'); return; }
    setPwSaving(true);
    try {
      const result = await window.electron?.auth.changePassword(user!.id, pwForm.old, pwForm.newPw);
      if (!result?.ok) { setPwError(result?.error ?? 'Failed to change password'); return; }
      setPwDone(true);
      setPwForm({ old: '', newPw: '', confirm: '' });
      setShowChangePw(false);
      setTimeout(() => setPwDone(false), 3000);
    } finally {
      setPwSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!user) return;
    await window.electron?.db.sessions?.revoke(user.id, sessionId);
    setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
  };

  const handleClearData = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    setClearing(true);
    try {
      await window.electron?.db.clearUserData(user!.id);
      // Reload the renderer so FinanceContext re-hydrates from the now-empty DB
      window.location.reload();
    } finally {
      setClearing(false);
      setClearConfirm(false);
    }
  };

  return (
    <AppShell>
      <div className="flex gap-5 min-h-0">

        {/* ── Sidebar nav ── */}
        <motion.aside
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 }}
          className="w-52 shrink-0"
        >
          <div className="card p-2 flex flex-col gap-0.5">
            {sections.map((s, i) => {
              const on = active === s.id;
              return (
                <motion.button key={s.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + i * 0.04 }}
                  onClick={() => setActive(s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: on ? 'rgba(74,222,128,0.08)' : 'transparent',
                    color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}>
                  <s.icon size={15} style={{ color: on ? 'var(--accent-brand)' : 'inherit', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: on ? 600 : 400 }}>{s.label}</span>
                  {on && <ChevronRight size={11} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />}
                </motion.button>
              );
            })}
          </div>

          {/* Quick stats */}
          <div className="card p-4 mt-3 flex flex-col gap-3">
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Your Plan</div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-brand-dim)', border: '1px solid rgba(74,222,128,0.3)' }}>
                <Zap size={13} style={{ color: 'var(--accent-brand)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Free</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Current plan</div>
              </div>
            </div>
            {[
              { icon: BarChart3, label: '4 accounts' },
              { icon: Target,    label: '4 goals' },
              { icon: Receipt,   label: '8 bills' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={11} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
            <button onClick={() => setActive('upgrade')}
              className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110 mt-1"
              style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
              Upgrade
            </button>
          </div>
        </motion.aside>

        {/* ── Content panel ── */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">

            {/* ─── Profile ─── */}
            {active === 'profile' && (
              <motion.div key="profile"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4">

                {/* Avatar card */}
                <div className="card p-6">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          className="w-20 h-20 rounded-2xl object-cover shrink-0"
                          style={{ border: '2px solid rgba(74,222,128,0.3)' }}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.3), rgba(96,165,250,0.3))', border: '2px solid rgba(74,222,128,0.3)', color: 'var(--accent-brand)' }}>
                          {profile.name ? profile.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                        </div>
                      )}
                      <button
                        onClick={handleAvatarClick}
                        className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
                        <Camera size={12} />
                      </button>
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{profile.name || user?.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{profile.email || user?.email}</div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: 'var(--accent-brand-dim)', color: 'var(--accent-brand)', border: '1px solid rgba(74,222,128,0.25)' }}>
                          Free Plan
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· Member since Feb 2026</span>
                      </div>
                    </div>
                  </div>
                </div>
                {avatarError && (
                  <p className="mt-2 text-xs" style={{ color: '#f87171' }}>{avatarError}</p>
                )}

                {/* Form card */}
                <div className="card p-6 flex flex-col gap-5">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Personal Information</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Update your name, email and regional preferences.</div>
                  </div>

                  {profileLoading ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading…</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Full Name',      key: 'name',     placeholder: 'Your name' },
                          { label: 'Email Address',  key: 'email',    placeholder: 'you@email.com' },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{f.label}</label>
                            <input
                              value={profile[f.key as keyof typeof profile]}
                              onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                              placeholder={f.placeholder}
                              className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none transition-colors"
                              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }} />
                          </div>
                        ))}

                        <div>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Currency</label>
                          <select value={profile.currency} onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}
                            className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none"
                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }}>
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Timezone</label>
                          <select value={profile.timezone} onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
                            className="w-full mt-1.5 px-3 py-2.5 rounded-xl outline-none"
                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }}>
                            {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        {saveError && (
                          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent-red)' }}>
                            <AlertCircle size={12} /> {saveError}
                          </span>
                        )}
                        <button onClick={handleSave}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            background: saved ? 'rgba(34,197,94,0.12)' : 'var(--accent-brand)',
                            color: saved ? 'var(--accent-green)' : '#0d1117',
                            border: saved ? '1px solid rgba(34,197,94,0.3)' : 'none',
                          }}>
                          {saved ? <><Check size={13} /> Saved</> : 'Save Changes'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── Notifications ─── */}
            {active === 'notifications' && (
              <motion.div key="notifications"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="card p-6 flex flex-col gap-5">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Notification Preferences</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Choose what you want to be notified about.</div>
                </div>

                <div className="flex flex-col">
                  {[
                    { key: 'systemNotifications', label: 'System Notifications', desc: 'Show OS desktop popups for in-app notifications', icon: Bell },
                    { key: 'billReminders',     label: 'Bill Reminders',     desc: 'Get notified 3 days before a bill is due',          icon: Receipt },
                    { key: 'goalProgress',      label: 'Goal Milestones',    desc: 'Alerts when you hit 25%, 50%, 75%, 100% of a goal', icon: Target },
                    { key: 'largeTransactions', label: 'Large Transactions', desc: 'Alerts for any single transaction over $200',        icon: CreditCard },
                    { key: 'monthlyReport',     label: 'Monthly Summary',    desc: 'Your full finance report at the end of each month',  icon: BarChart3 },
                    { key: 'weeklyDigest',      label: 'Weekly Digest',      desc: 'A brief weekly snapshot of income and spend',        icon: Zap },
                  ].map((item, i) => {
                    const on = notifs[item.key as keyof typeof notifs];
                    return (
                      <motion.div key={item.key}
                        initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-4"
                        style={{ borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: on ? 'var(--accent-brand-dim)' : 'var(--bg-card)', border: `1px solid ${on ? 'rgba(74,222,128,0.25)' : 'var(--border)'}` }}>
                            <item.icon size={14} style={{ color: on ? 'var(--accent-brand)' : 'var(--text-muted)' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{item.desc}</div>
                          </div>
                        </div>
                        <button onClick={() => handleToggle(item.key as keyof typeof notifs)}
                          className="relative shrink-0 transition-all duration-200"
                          style={{ width: 40, height: 22, borderRadius: 11, background: on ? 'var(--accent-brand)' : 'var(--bg-card-hover)', border: '1px solid var(--border-light)' }}>
                          <motion.div
                            animate={{ x: on ? 20 : 2 }}
                            transition={{ duration: 0.15, ease: 'easeInOut' }}
                            className="absolute top-0.5 w-4 h-4 rounded-full"
                            style={{ background: on ? '#0d1117' : 'var(--text-muted)' }} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ─── Security ─── */}
            {active === 'security' && (
              <motion.div key="security"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4">

                <div className="card p-6 flex flex-col gap-3">
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Security Settings</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Manage your account security and access.</div>

                  {/* Change Password */}
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                    <button
                      onClick={() => { setShowChangePw(v => !v); setPwError(''); setPwDone(false); }}
                      className="flex items-center gap-4 p-4 text-left w-full group">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <Lock size={16} style={{ color: pwDone ? 'var(--accent-brand)' : 'var(--text-muted)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Change Password</div>
                        <div style={{ fontSize: 11, color: pwDone ? 'var(--accent-brand)' : 'var(--text-muted)', marginTop: 2 }}>
                          {pwDone ? 'Password updated successfully' : 'Update your account password'}
                        </div>
                      </div>
                      <motion.div animate={{ rotate: showChangePw ? 90 : 0 }} transition={{ duration: 0.15 }}>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {showChangePw && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          style={{ borderTop: '1px solid var(--border)' }}>
                          <div className="p-4 flex flex-col gap-3">
                            {[
                              { label: 'Current Password', key: 'old',     show: showPw.old },
                              { label: 'New Password',     key: 'newPw',   show: showPw.newPw },
                              { label: 'Confirm New',      key: 'confirm', show: showPw.confirm },
                            ].map(f => (
                              <div key={f.key}>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{f.label}</label>
                                <div className="relative mt-1.5">
                                  <input
                                    type={f.show ? 'text' : 'password'}
                                    value={pwForm[f.key as keyof typeof pwForm]}
                                    onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl outline-none pr-10"
                                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13 }} />
                                  <button type="button"
                                    onClick={() => setShowPw(p => ({ ...p, [f.key]: !p[f.key as keyof typeof p] }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--text-muted)' }}>
                                    {f.show ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                </div>
                              </div>
                            ))}

                            {pwError && (
                              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent-red)' }}>
                                <AlertCircle size={12} /> {pwError}
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button onClick={() => { setShowChangePw(false); setPwError(''); setPwForm({ old: '', newPw: '', confirm: '' }); }}
                                className="px-4 py-2 rounded-xl text-xs font-medium"
                                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                Cancel
                              </button>
                              <button onClick={handleChangePassword} disabled={pwSaving}
                                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-110"
                                style={{ background: 'var(--accent-brand)', color: '#0d1117', opacity: pwSaving ? 0.7 : 1 }}>
                                {pwSaving ? 'Saving…' : 'Update Password'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* 2FA — Coming Soon */}
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-primary)', opacity: 0.6 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <Smartphone size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Two-Factor Authentication</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide"
                          style={{ background: 'rgba(96,165,250,0.12)', color: 'rgb(96,165,250)', border: '1px solid rgba(96,165,250,0.2)' }}>
                          Coming Soon
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Add an extra layer of account security</div>
                    </div>
                  </motion.div>

                  {/* Active Sessions */}
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <Shield size={16} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Active Sessions</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>View and manage active login sessions</div>
                      </div>
                    </div>

                    {sessionsLoading ? (
                      <div className="px-4 pb-4" style={{ fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>Loading sessions…</div>
                    ) : sessions.length === 0 ? (
                      <div className="px-4 pb-4" style={{ fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>No sessions found.</div>
                    ) : (
                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        {sessions.map((s, i) => {
                          // Match by sessionId if available (fresh login), else treat the most recent session as current
                          const isCurrent = user?.sessionId
                            ? s.sessionId === user.sessionId
                            : i === 0;
                          return (
                            <div key={s.sessionId}
                              className="flex items-center gap-3 px-4 py-3"
                              style={{ borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                              <Monitor size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{s.deviceLabel}</span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                      style={{ background: 'var(--accent-brand-dim)', color: 'var(--accent-brand)', border: '1px solid rgba(74,222,128,0.25)' }}>
                                      Current
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  <span>Logged in {formatDate(s.createdAt)}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={9} /> Last active {timeAgo(s.lastActiveAt)}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRevokeSession(s.sessionId)}
                                disabled={isCurrent}
                                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                                style={{
                                  background: isCurrent ? 'transparent' : 'rgba(248,113,113,0.08)',
                                  color: isCurrent ? 'var(--text-muted)' : 'var(--accent-red)',
                                  border: `1px solid ${isCurrent ? 'var(--border)' : 'rgba(248,113,113,0.2)'}`,
                                  cursor: isCurrent ? 'not-allowed' : 'pointer',
                                  opacity: isCurrent ? 0.5 : 1,
                                }}>
                                {isCurrent ? 'Active' : 'Revoke'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Danger zone */}
                <div className="card p-6 flex flex-col gap-3"
                  style={{ border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.03)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-red)' }}>Danger Zone</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>These actions are permanent and cannot be undone.</div>
                  <button className="flex items-center gap-3 p-4 rounded-2xl text-left w-full transition-all"
                    style={{ border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.04)', color: 'var(--accent-red)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                    </div>
                    <div className="flex-1">
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Delete Account</div>
                      <div style={{ fontSize: 11, color: 'rgba(248,113,113,0.7)', marginTop: 2 }}>Permanently delete your account and all data</div>
                    </div>
                    <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={handleClearData}
                    disabled={clearing}
                    className="flex items-center gap-3 p-4 rounded-2xl text-left w-full transition-all"
                    style={{ border: '1px solid rgba(248,113,113,0.25)', background: clearConfirm ? 'rgba(248,113,113,0.1)' : 'rgba(248,113,113,0.04)', color: 'var(--accent-red)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                    </div>
                    <div className="flex-1">
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {clearing ? 'Clearing…' : clearDone ? 'All data cleared' : clearConfirm ? 'Click again to confirm' : 'Clear All My Data'}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(248,113,113,0.7)', marginTop: 2 }}>
                        {clearDone ? 'Your data has been removed' : clearConfirm ? 'This will delete all transactions, goals, bills and accounts' : 'Remove all transactions, goals, bills, and accounts'}
                      </div>
                    </div>
                    {!clearing && <ChevronRight size={14} />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── Billing / Upgrade ─── */}
            {(active === 'billing' || active === 'upgrade') && (
              <motion.div key="billing"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4">

                {/* Current plan banner */}
                <div className="card p-5 flex items-center gap-4"
                  style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.06), rgba(96,165,250,0.04))', border: '1px solid rgba(74,222,128,0.15)' }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent-brand-dim)', border: '1px solid rgba(74,222,128,0.3)' }}>
                    <Zap size={18} style={{ color: 'var(--accent-brand)' }} />
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>You're on the Free plan</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Upgrade to unlock unlimited accounts, goals, and premium analytics.</div>
                  </div>
                </div>

                {/* Plan cards */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      name: 'Free', price: '$0', period: '/mo',
                      features: ['Up to 5 accounts', '3 savings goals', 'Basic analytics', 'Manual transactions', 'Bill tracking'],
                      current: true, color: 'var(--text-secondary)',
                    },
                    {
                      name: 'Premium', price: '$7', period: '/mo',
                      features: ['Unlimited accounts', 'Unlimited goals', 'Advanced analytics', 'Auto-import transactions', 'Budget forecasting', 'Priority support'],
                      current: false, color: 'var(--accent-brand)',
                    },
                  ].map(plan => (
                    <div key={plan.name} className="p-5 rounded-2xl flex flex-col gap-4"
                      style={{
                        background: plan.current ? 'var(--bg-primary)' : 'linear-gradient(135deg, rgba(74,222,128,0.05), rgba(96,165,250,0.05))',
                        border: `1px solid ${plan.current ? 'var(--border)' : 'rgba(74,222,128,0.3)'}`,
                      }}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plan.name}</span>
                          {plan.current && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                              Current
                            </span>
                          )}
                          {!plan.current && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ background: 'var(--accent-brand-dim)', color: 'var(--accent-brand)', border: '1px solid rgba(74,222,128,0.25)' }}>
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span style={{ fontSize: 32, fontWeight: 800, color: plan.color, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.03em' }}>{plan.price}</span>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{plan.period}</span>
                        </div>
                      </div>

                      <ul className="flex flex-col gap-2.5">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2.5">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: plan.current ? 'var(--bg-card)' : 'rgba(74,222,128,0.15)' }}>
                              <Check size={9} style={{ color: plan.current ? 'var(--text-muted)' : 'var(--accent-brand)' }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <button disabled={plan.current}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 mt-auto"
                        style={{
                          background: plan.current ? 'transparent' : 'var(--accent-brand)',
                          color: plan.current ? 'var(--text-muted)' : '#0d1117',
                          border: plan.current ? '1px solid var(--border)' : 'none',
                          cursor: plan.current ? 'not-allowed' : 'pointer',
                        }}>
                        {plan.current ? 'Current Plan' : 'Upgrade Now →'}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── Updates ─── */}
            {active === 'updates' && (
              <motion.div key="updates"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4">

                {/* Version info card */}
                <div className="card p-6 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent-brand-dim)', border: '1px solid rgba(74,222,128,0.3)' }}>
                    <ArrowUpCircle size={18} style={{ color: 'var(--accent-brand)' }} />
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>App Updates</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Current version:{' '}
                      <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--text-secondary)' }}>
                        v{appVersion || '0.1.0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status + action card */}
                <div className="card p-6 flex flex-col gap-5">

                  {/* Status row */}
                  <div className="flex items-center gap-3">
                    {updateStatus === 'idle' && (
                      <>
                        <RefreshCw size={15} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Click below to check for updates.</span>
                      </>
                    )}
                    {updateStatus === 'checking' && (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                          <RefreshCw size={15} style={{ color: 'var(--accent-brand)' }} />
                        </motion.div>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Checking for updates…</span>
                      </>
                    )}
                    {updateStatus === 'up-to-date' && (
                      <>
                        <CheckCircle size={15} style={{ color: 'var(--accent-green)' }} />
                        <span style={{ fontSize: 13, color: 'var(--accent-green)' }}>You're on the latest version.</span>
                      </>
                    )}
                    {updateStatus === 'available' && (
                      <>
                        <ArrowUpCircle size={15} style={{ color: 'var(--accent-brand)' }} />
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                          Update available — v{updateInfo?.version}
                        </span>
                      </>
                    )}
                    {updateStatus === 'downloading' && (
                      <>
                        <Download size={15} style={{ color: 'var(--accent-brand)' }} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          Downloading… {downloadProgress}%
                        </span>
                      </>
                    )}
                    {updateStatus === 'downloaded' && (
                      <>
                        <CheckCircle size={15} style={{ color: 'var(--accent-green)' }} />
                        <span style={{ fontSize: 13, color: 'var(--accent-green)' }}>
                          Update downloaded. Ready to install.
                        </span>
                      </>
                    )}
                    {updateStatus === 'error' && (
                      <>
                        <AlertCircle size={15} style={{ color: 'var(--accent-red)' }} />
                        <span style={{ fontSize: 13, color: 'var(--accent-red)' }}>
                          Update error: {updateError}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Progress bar — only visible during download */}
                  {updateStatus === 'downloading' && (
                    <div className="w-full rounded-full overflow-hidden"
                      style={{ height: 6, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'var(--accent-brand)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${downloadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}

                  {/* Release notes */}
                  {(updateStatus === 'available' || updateStatus === 'downloaded') && updateInfo?.releaseNotes && (
                    <div className="rounded-xl p-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>
                        What's new in v{updateInfo.version}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        {String(updateInfo.releaseNotes)}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>

                    {/* Check for updates */}
                    {updateStatus !== 'downloading' && updateStatus !== 'downloaded' && (
                      <button
                        disabled={updateStatus === 'checking'}
                        onClick={() => window.electron?.updater.check()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: 'var(--bg-card)',
                          color: updateStatus === 'checking' ? 'var(--text-muted)' : 'var(--text-primary)',
                          border: '1px solid var(--border)',
                          cursor: updateStatus === 'checking' ? 'not-allowed' : 'pointer',
                          opacity: updateStatus === 'checking' ? 0.6 : 1,
                        }}>
                        <RefreshCw size={13} />
                        Check for Updates
                      </button>
                    )}

                    {/* Download update */}
                    {updateStatus === 'available' && (
                      <button
                        onClick={() => window.electron?.updater.download()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                        style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
                        <Download size={13} />
                        Download Update
                      </button>
                    )}

                    {/* Restart & Install */}
                    {updateStatus === 'downloaded' && (
                      <button
                        onClick={() => window.electron?.updater.install()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                        style={{ background: 'var(--accent-brand)', color: '#0d1117' }}>
                        <ArrowUpCircle size={13} />
                        Restart &amp; Install
                      </button>
                    )}

                    {/* Retry on error */}
                    {updateStatus === 'error' && (
                      <button
                        onClick={() => { setUpdateStatus('idle'); setUpdateError(''); window.electron?.updater.check(); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(248,113,113,0.2)' }}>
                        <RefreshCw size={13} />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
