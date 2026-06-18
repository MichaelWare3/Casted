import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

interface QuestionCardProps {
  id: number | string
  prompt: string
  options: string[]
  step: number // 1-based
  total: number
  onAnswer: (index: number) => void
  onBack?: () => void
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function QuestionCard({
  id,
  prompt,
  options,
  step,
  total,
  onAnswer,
  onBack,
}: QuestionCardProps) {
  const canGoBack = !!onBack && step > 1

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full max-w-2xl flex-col px-6"
    >
      <div className="mb-5 flex items-center gap-3">
        {canGoBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Previous question"
            className="flex h-7 w-7 items-center justify-center rounded-full text-casted-muted transition-colors duration-200 hover:text-casted-cream"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
          </button>
        )}
        <span className="font-body text-[10px] uppercase tracking-[0.45em] text-casted-muted">
          Scene {pad(step)} <span className="text-casted-gold/50">/</span> {pad(total)}
        </span>
      </div>

      <div className="mb-10 h-px w-full bg-casted-cream/10">
        <motion.div
          className="h-px bg-casted-gold"
          initial={false}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-14 font-display text-3xl italic leading-[1.15] text-casted-cream sm:mb-16 sm:text-4xl"
      >
        {prompt}
      </motion.h2>

      <div className="flex w-full flex-col items-stretch gap-4">
        {options.map((option, i) => (
          <motion.button
            key={option}
            type="button"
            onClick={() => onAnswer(i)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.985 }}
            className="group relative isolate overflow-hidden rounded-full border border-casted-gold/55 bg-[rgba(184,149,42,0.10)] px-9 py-6 text-center shadow-[0_0_38px_-10px_rgba(184,149,42,0.6)] transition-[background-color,border-color,box-shadow] duration-300 ease-out hover:border-casted-gold hover:bg-[rgba(184,149,42,0.15)] hover:shadow-[0_0_52px_-6px_rgba(184,149,42,0.78)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-casted-gold/60"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 opacity-[0.85] transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(184,149,42,0.18) 0%, transparent 72%)',
              }}
            />
            <span className="relative z-10 font-body text-lg font-medium leading-snug text-white sm:text-xl">
              {option}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
