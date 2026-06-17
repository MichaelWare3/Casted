import { motion } from 'framer-motion'

interface LoadingDotsProps {
  className?: string
  size?: number
}

export default function LoadingDots({ className, size = 8 }: LoadingDotsProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center ${className ?? ''}`}
      style={{ gap: `${Math.round(size * 1.5)}px` }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '9999px',
            background: '#B8952A',
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  )
}
