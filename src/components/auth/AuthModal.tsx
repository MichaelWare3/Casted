import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface AuthModalProps {
  onClose: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }
    setBusy(true)
    const res = mode === 'in' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (res.error) {
      setError(res.error)
      return
    }
    if (res.needsConfirmation) {
      setNotice('Check your email to confirm your account, then sign in.')
      setMode('in')
      return
    }
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(242,236,216,0.04)',
    border: '1px solid rgba(184,149,42,0.3)',
    color: '#F2ECD8',
    fontSize: '15px',
    outline: 'none',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center px-4"
      style={{ background: 'rgba(10,10,11,0.97)' }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="fixed right-6 top-6 z-[130] flex h-10 w-10 items-center justify-center text-casted-cream transition-colors hover:text-casted-gold"
      >
        <X size={22} strokeWidth={1.5} />
      </button>

      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
        style={{ background: '#111114', border: '1px solid rgba(184,149,42,0.18)', padding: '36px 32px' }}
      >
        <p className="font-body text-[10px] uppercase tracking-[0.4em] text-casted-gold/70">
          Your Cinema, Everywhere
        </p>
        <h2 className="mt-3 font-display text-3xl italic text-casted-cream">
          {mode === 'in' ? 'Sign in' : 'Create account'}
        </h2>
        <p className="mt-2 font-body text-xs text-casted-muted">
          Sync your Theater, ratings, and characters across devices.
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          {error && <p className="font-body text-xs text-casted-red">{error}</p>}
          {notice && <p className="font-body text-xs text-casted-gold">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 font-body text-xs uppercase tracking-widest text-casted-black transition-all disabled:opacity-50"
            style={{ padding: '13px', background: '#B8952A', border: '1px solid #B8952A', cursor: 'pointer' }}
          >
            {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === 'in' ? 'up' : 'in'))
            setError(null)
            setNotice(null)
          }}
          className="mt-5 font-body text-xs text-casted-cream/60 transition-colors hover:text-casted-cream"
        >
          {mode === 'in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </motion.div>
    </motion.div>
  )
}
