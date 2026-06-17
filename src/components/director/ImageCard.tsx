import { useState } from 'react'
import { motion } from 'framer-motion'

interface ImageCardProps {
  label: string
  background: string | null
  delay?: number
  onClick: () => void
}

export default function ImageCard({ label, background, delay = 0, onClick }: ImageCardProps) {
  const [hover, setHover] = useState(false)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      className="group relative overflow-hidden text-left"
      style={{
        aspectRatio: '4 / 3',
        border: 'none',
        background: '#111114',
        cursor: 'pointer',
      }}
    >
      {background && (
        <img
          src={background}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            filter: 'grayscale(15%) brightness(0.55) contrast(1.1)',
            transform: hover ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,11,0.35) 0%, rgba(10,10,11,0.55) 55%, rgba(10,10,11,0.85) 100%)',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: hover
            ? 'inset 0 0 80px rgba(184,149,42,0.25)'
            : 'inset 0 0 0 rgba(184,149,42,0)',
          transition: 'box-shadow 0.4s ease',
        }}
      />

      <div className="relative flex h-full w-full items-center justify-center px-4">
        <span
          className="text-center font-display italic text-white"
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            letterSpacing: '0.02em',
            textShadow: '0 2px 16px rgba(0,0,0,0.55)',
            fontWeight: 700,
          }}
        >
          {label}
        </span>
      </div>
    </motion.button>
  )
}
