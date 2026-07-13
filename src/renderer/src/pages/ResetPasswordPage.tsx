import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hexagon, Lock, ArrowRight } from 'lucide-react'

export default function ResetPasswordPage() {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  // Hash router keeps the token in the route query, not window.location.search.
  const [searchParams] = useSearchParams()

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    const token = searchParams.get('token') ?? ''
    const r = await window.electron?.auth.resetPassword(token, pw)
    if (r?.ok) {
      navigate('/login')
    } else {
      setErr(r?.error || 'Reset failed. The link may have expired.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: 'rgba(132,204,22,0.12)' }}
          >
            <Hexagon size={32} className="text-lime-500" />
          </div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
            Set a new password
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', lineHeight: 1.5 }}>
            Choose a strong password with at least 6 characters.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, paddingLeft: 4 }}>
              New password
            </label>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Lock size={18} style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="password"
                required
                minLength={6}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent border-none outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {err && (
            <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginTop: -4 }}>{err}</p>
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
              boxShadow: '0 4px 14px rgba(74, 222, 128, 0.25)',
            }}
          >
            {loading ? (
              <span>Resetting…</span>
            ) : (
              <>
                <span>Reset password</span>
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Remembered it?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{ color: 'var(--accent-brand)', fontWeight: 500 }}
            className="hover:underline"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  )
}
