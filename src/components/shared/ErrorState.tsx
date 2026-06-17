import { motion } from 'framer-motion'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  retryLabel?: string
}

export default function ErrorState({
  message = 'Something went wrong. Try again.',
  onRetry,
  retryLabel = 'Try Again',
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      role="alert"
      className="flex flex-col items-center text-center"
      style={{ padding: '48px 24px' }}
    >
      <p className="font-display text-3xl italic text-casted-cream">The reel snapped.</p>
      <p
        className="font-body text-sm"
        style={{ marginTop: '12px', color: '#6B6B7A', maxWidth: '420px' }}
      >
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-body text-xs uppercase tracking-widest transition-all"
          style={{
            marginTop: '32px',
            padding: '12px 40px',
            background: 'transparent',
            border: '1px solid rgba(184,149,42,0.4)',
            color: '#F2ECD8',
            borderRadius: 0,
            transitionDuration: '0.25s',
            transitionTimingFunction: 'ease',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(184,149,42,0.12)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#B8952A'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(184,149,42,0.4)'
          }}
        >
          {retryLabel}
        </button>
      )}
    </motion.div>
  )
}
