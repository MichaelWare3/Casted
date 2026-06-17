import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface LoadingRevealProps {
  ready: boolean
  onComplete: () => void
}

const LINES = [
  'Developing your character...',
  'Scanning 10,000 films...',
  "You've been CASTED.",
]

const PER_LINE_MS = 1200

export default function LoadingReveal({ ready, onComplete }: LoadingRevealProps) {
  const [index, setIndex] = useState(0)
  const [doneCycling, setDoneCycling] = useState(false)

  useEffect(() => {
    if (index < LINES.length - 1) {
      const t = setTimeout(() => setIndex((i) => i + 1), PER_LINE_MS)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setDoneCycling(true), PER_LINE_MS)
    return () => clearTimeout(t)
  }, [index])

  useEffect(() => {
    if (doneCycling && ready) onComplete()
  }, [doneCycling, ready, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-casted-black"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-casted-gold/5 blur-[120px]" />
      </div>

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="relative mb-12 h-20 w-20"
      >
        <div className="absolute inset-0 rounded-full border border-casted-gold/30" />
        <div className="absolute inset-2 rounded-full border border-casted-gold/20" />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-casted-gold/80" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div
            key={deg}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-casted-gold/60"
            style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-32px)` }}
          />
        ))}
      </motion.div>

      <div className="relative h-12 w-full max-w-xl text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 8, letterSpacing: '0.3em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.2em' }}
            exit={{ opacity: 0, y: -8, letterSpacing: '0.4em' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 font-body text-sm uppercase tracking-[0.2em] text-casted-cream"
          >
            {LINES[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
