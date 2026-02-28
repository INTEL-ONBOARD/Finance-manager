import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hexagon, Lock, Mail, ArrowRight, Download, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    type UpdateStatus = 'idle' | 'available' | 'downloading' | 'downloaded' | 'installing';
    const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
    const [updateProgress, setUpdateProgress] = useState(0);

    useEffect(() => {
        const el = window.electron?.updater;
        if (!el) return;
        const cleanups = [
            el.onAvailable(() => setUpdateStatus('available')),
            el.onNotAvailable(() => setUpdateStatus('idle')),
            el.onProgress((p) => { setUpdateProgress(p.percent); setUpdateStatus('downloading'); }),
            el.onDownloaded(() => setUpdateStatus('downloaded')),
            el.onError(() => setUpdateStatus('idle')),
        ];
        return () => cleanups.forEach(fn => fn());
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full" style={{ background: 'var(--bg-primary)' }}>
            {/* Visual / Left Side */}
            <div
                className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center"
                style={{
                    background: 'linear-gradient(145deg, #1a2a0a 0%, #1e3a10 40%, #0f2208 100%)',
                    borderRight: '1px solid rgba(0,0,0,0.15)'
                }}
            >
                <div className="absolute inset-0 opacity-[0.07]" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #84cc16 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />
                <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse at 50% 100%, rgba(132,204,22,0.18) 0%, transparent 70%)'
                }} />

                <div className="relative z-10 flex flex-col items-center max-w-md text-center p-12">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, type: 'spring' }}
                        style={{
                            width: 80, height: 80, borderRadius: 24,
                            background: '#84cc16',
                            boxShadow: '0 8px 32px rgba(132, 204, 22, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: 32
                        }}
                    >
                        <Hexagon size={48} className="text-white fill-white" />
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        style={{ color: '#f1f5f9', fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}
                    >
                        Manage your wealth<br />with <span style={{ color: '#84cc16' }}>FinMate</span>
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        style={{ color: 'rgba(241,245,249,0.6)', fontSize: 18, lineHeight: 1.5 }}
                    >
                        The premium way to track budgets, analyze spending, and reach your savings goals.
                    </motion.p>
                </div>
            </div>

            {/* Form / Right Side */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative"
                style={{ background: 'var(--bg-primary)' }}>
                {/* Dev: updater widget */}
                <div style={{ position: 'absolute', bottom: 16, right: 16 }}>
                    {updateStatus === 'idle' && (
                        <button
                            onClick={() => window.electron?.updater.check()}
                            title="Check for updates"
                            style={{ opacity: 0.35, color: 'var(--text-muted)' }}
                            className="hover:opacity-80 transition-opacity"
                        >
                            <Download size={16} />
                        </button>
                    )}
                    {updateStatus === 'available' && (
                        <button
                            onClick={() => window.electron?.updater.download()}
                            title="Download update"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: '#84cc16', color: '#0d1117',
                                borderRadius: 8, padding: '4px 10px',
                                fontSize: 11, fontWeight: 700,
                            }}
                            className="hover:brightness-110 transition-all"
                        >
                            <Download size={12} />
                            Download Update
                        </button>
                    )}
                    {updateStatus === 'downloading' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* Circular progress */}
                            <svg width="28" height="28" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(132,204,22,0.15)" strokeWidth="2.5" />
                                <circle
                                    cx="14" cy="14" r="11" fill="none"
                                    stroke="#84cc16" strokeWidth="2.5"
                                    strokeDasharray={`${2 * Math.PI * 11}`}
                                    strokeDashoffset={`${2 * Math.PI * 11 * (1 - updateProgress / 100)}`}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                                />
                            </svg>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>
                                {Math.round(updateProgress)}%
                            </span>
                        </div>
                    )}
                    {updateStatus === 'downloaded' && (
                        <button
                            onClick={() => { setUpdateStatus('installing'); window.electron?.updater.install(); }}
                            title="Restart & install"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: '#84cc16', color: '#0d1117',
                                borderRadius: 8, padding: '4px 10px',
                                fontSize: 11, fontWeight: 700,
                            }}
                            className="hover:brightness-110 transition-all"
                        >
                            <RotateCcw size={12} />
                            Restart & Install
                        </button>
                    )}
                    {updateStatus === 'installing' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.6 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                                <circle cx="12" cy="12" r="10" fill="none" stroke="#84cc16" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                            </svg>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Installing…</span>
                        </div>
                    )}
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10 text-center lg:text-left">
                        <h2 style={{ color: 'var(--text-primary)', fontSize: 32, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
                            Welcome back
                        </h2>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Enter your credentials to access your account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, paddingLeft: 4 }}>
                                Email address
                            </label>
                            <div
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-subtle)',
                                }}
                            >
                                <Mail size={18} style={{ color: 'var(--text-tertiary)' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                    className="flex-1 bg-transparent border-none outline-none"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center px-1">
                                <label style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>
                                    Password
                                </label>
                                <button type="button" style={{ color: 'var(--accent-brand)', fontSize: 13, fontWeight: 500 }}>
                                    Forgot password?
                                </button>
                            </div>
                            <div
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-subtle)',
                                }}
                            >
                                <Lock size={18} style={{ color: 'var(--text-tertiary)' }} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="flex-1 bg-transparent border-none outline-none"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

                        {error && (
                            <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginTop: -4 }}>{error}</p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-medium mt-2 transition-all"
                            style={{
                                background: 'linear-gradient(90deg, var(--accent-green), var(--accent-brand))',
                                color: 'white',
                                opacity: loading ? 0.7 : 1,
                                boxShadow: '0 4px 14px rgba(74, 222, 128, 0.25)'
                            }}
                        >
                            {loading ? (
                                <span>Signing in...</span>
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Don't have an account?{' '}
                        <button
                            onClick={() => navigate('/register')}
                            style={{ color: 'var(--accent-brand)', fontWeight: 500 }}
                            className="hover:underline"
                        >
                            Sign up
                        </button>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
