import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hexagon, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function VerifyPage(): JSX.Element {
  const [msg, setMsg] = useState('Verifying your email…')
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const navigate = useNavigate()
  // Hash router keeps the token in the route query, not window.location.search.
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token') ?? ''
    if (!token) {
      setMsg('Missing verification token.')
      setStatus('error')
      return
    }
    window.electron?.auth.verifyEmail(token)?.then((r) => {
      if (r.ok) {
        // verifyEmail already stored the access token; persist the user the same
        // way AuthContext.login does so AuthProvider hydrates as authenticated,
        // then force a remount (hash replace) so it re-reads localStorage.
        if (r.user) {
          localStorage.setItem('finmate-auth-user', JSON.stringify({ ...r.user, sessionId: r.sessionId }))
        }
        localStorage.setItem('finwise-onboarded', 'false')
        setMsg('Email verified! Redirecting to your account…')
        setStatus('success')
        // Preserve the app's base path (e.g. /finwise-app/) — an absolute
        // '/#/onboarding' would drop it and land on the site root (blank page).
        setTimeout(() => window.location.replace(`${window.location.pathname}#/onboarding`), 1200)
      } else {
        setMsg(r.error || 'Verification failed. The link may have expired.')
        setStatus('error')
      }
    }).catch(() => {
      setMsg('Verification failed. The link may have expired.')
      setStatus('error')
    })
  }, [navigate, searchParams])

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
          style={{ background: 'rgba(132,204,22,0.12)' }}
        >
          <Hexagon size={32} className="text-lime-500" />
        </div>

        <h2 style={{ color: 'var(--text-primary)', fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
          Email verification
        </h2>

        <div className="flex items-center gap-3 mt-4">
          {status === 'pending' && (
            <Loader size={20} className="text-lime-500 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle size={20} style={{ color: '#4ade80' }} />
          )}
          {status === 'error' && (
            <XCircle size={20} style={{ color: '#f87171' }} />
          )}
          <p style={{
            color: status === 'error' ? '#f87171' : status === 'success' ? '#4ade80' : 'var(--text-secondary)',
            fontSize: 15,
          }}>
            {msg}
          </p>
        </div>

        {status === 'error' && (
          <button
            onClick={() => navigate('/login')}
            className="mt-6 hover:underline"
            style={{ color: 'var(--accent-brand)', fontSize: 14, fontWeight: 500 }}
          >
            Back to sign in
          </button>
        )}
      </motion.div>
    </div>
  )
}
