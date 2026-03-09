import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hexagon, Lock, Mail, User, ArrowRight, WifiOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const _avatarModules = import.meta.glob(
    '../../public/profile-avatar/monster*.png',
    { eager: true, query: '?url', import: 'default' }
);
const AVATARS: string[] = Object.entries(_avatarModules)
    .sort(([a], [b]) => {
        const numA = parseInt(a.match(/_(\d+)\.png$/)?.[1] ?? '0');
        const numB = parseInt(b.match(/_(\d+)\.png$/)?.[1] ?? '0');
        return numA - numB;
    })
    .map(([, url]) => url as string);

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dbStatus, setDbStatus] = useState<{ ready: boolean; error: string | null } | null>(null);
    const [retrying, setRetrying] = useState(false);

    useEffect(() => {
        window.electron?.db.status().then(setDbStatus).catch(() => setDbStatus({ ready: false, error: 'Could not reach the app backend.' }));
    }, []);

    const handleRetryConnection = async () => {
        setRetrying(true);
        try {
            const result = await window.electron?.db.reconnect();
            const status = await window.electron?.db.status();
            setDbStatus(status ?? null);
            if (result?.ok) setError('');
        } finally {
            setRetrying(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(name, email, password, selectedAvatar);
            localStorage.setItem('finwise-onboarded', 'false');
            navigate('/onboarding');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
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
                        Start your journey <br />with <span style={{ color: '#84cc16' }}>FinMate</span>
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        style={{ color: 'rgba(241,245,249,0.6)', fontSize: 18, lineHeight: 1.5 }}
                    >
                        Create an account to gain deep insights into your financial life and achieve your goals.
                    </motion.p>
                </div>
            </div>

            {/* Form / Right Side */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative"
                style={{ background: 'var(--bg-primary)' }}>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10 text-center lg:text-left">
                        <h2 style={{ color: 'var(--text-primary)', fontSize: 32, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
                            Create an account
                        </h2>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Enter your details to register.
                        </p>
                    </div>

                    {dbStatus && !dbStatus.ready && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 rounded-xl px-4 py-3 mb-4"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                        >
                            <WifiOff size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
                            <div className="flex-1 min-w-0">
                                <p style={{ color: '#f87171', fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                                    Unable to connect to database
                                </p>
                                <p style={{ color: 'rgba(248,113,113,0.75)', fontSize: 12, lineHeight: 1.4 }}>
                                    Please check your internet connection and try again.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleRetryConnection}
                                disabled={retrying}
                                className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity"
                                style={{ color: '#f87171', fontSize: 12, fontWeight: 600 }}
                            >
                                <RefreshCw size={13} style={{ animation: retrying ? 'spin 1s linear infinite' : 'none' }} />
                                {retrying ? 'Retrying…' : 'Retry'}
                            </button>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                        {/* Avatar Picker */}
                        <div className="flex flex-col gap-2">
                            <label style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, paddingLeft: 4 }}>
                                Choose your avatar
                            </label>
                            <div className="grid grid-cols-7 gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                {AVATARS.map((src) => (
                                    <button
                                        key={src}
                                        type="button"
                                        onClick={() => setSelectedAvatar(src)}
                                        className="relative rounded-xl overflow-hidden transition-all"
                                        style={{
                                            aspectRatio: '1',
                                            padding: 2,
                                            background: selectedAvatar === src ? 'var(--accent-brand)' : 'transparent',
                                            outline: 'none',
                                            boxShadow: selectedAvatar === src ? '0 0 0 2px var(--accent-brand)' : 'none',
                                        }}
                                    >
                                        <img
                                            src={src}
                                            alt="avatar"
                                            className="w-full h-full rounded-lg object-cover"
                                            style={{ display: 'block' }}
                                        />
                                        {selectedAvatar === src && (
                                            <div className="absolute inset-0 rounded-xl" style={{ background: 'rgba(132,204,22,0.15)' }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, paddingLeft: 4 }}>
                                Full Name
                            </label>
                            <div
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-subtle)',
                                }}
                            >
                                <User size={18} style={{ color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                    className="flex-1 bg-transparent border-none outline-none"
                                    style={{ color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>

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
                            <label style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, paddingLeft: 4 }}>
                                Password
                            </label>
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
                                <span>Creating account...</span>
                            ) : (
                                <>
                                    <span>Sign up</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            style={{ color: 'var(--accent-brand)', fontWeight: 500 }}
                            className="hover:underline"
                        >
                            Log in
                        </button>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
