import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hexagon, Mail, ArrowRight, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    await window.electron?.auth.forgotPassword(email)
    setSent(true) // always show success (no enumeration)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md flex flex-col items-center text-center p-8 rounded-2xl"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: 'rgba(74,222,128,0.12)' }}
          >
            <CheckCircle size={32} style={{ color: '#4ade80' }} />
          </div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Check your inbox
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
            If an account exists for <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{email}</span>, a reset link is on its way.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-8 hover:underline"
            style={{ color: 'var(--accent-brand)', fontSize: 14, fontWeight: 500 }}
          >
            Back to sign in
          </button>
        </motion.div>
      </div>
    )
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
            Forgot password?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', lineHeight: 1.5 }}>
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, paddingLeft: 4 }}>
              Email address
            </label>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Mail size={18} style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent border-none outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

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
              <span>Sending…</span>
            ) : (
              <>
                <span>Send reset link</span>
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
