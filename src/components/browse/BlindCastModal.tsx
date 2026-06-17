import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import PosterImage from '../shared/PosterImage'
import { castedScore, getYear, posterUrl } from '../../lib/tmdb'
import type { TMDBMovie } from '../../types'

interface BlindCastModalProps {
  movie: TMDBMovie
  onClose: () => void
  onReveal: (movie: TMDBMovie) => void
}

export default function BlindCastModal({ movie, onClose, onReveal }: BlindCastModalProps) {
  const [flipped, setFlipped] = useState(false)
  const poster = posterUrl(movie.poster_path, 'large')
  const score = castedScore(movie)
  const year = getYear(movie.release_date)

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ background: 'rgba(10,10,11,0.97)' }}
    >
      <button
        onClick={onClose}
        className="absolute right-6 top-6 z-[110] flex h-10 w-10 items-center justify-center text-casted-cream transition-colors hover:text-casted-gold"
        aria-label="Close"
      >
        <X size={22} strokeWidth={1.5} />
      </button>

      <div
        className="flex flex-col items-center"
        style={{ perspective: '1600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: flipped ? 0 : 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="font-display text-sm italic uppercase tracking-[0.5em] text-casted-gold"
          style={{ marginBottom: '24px' }}
        >
          Casting…
        </motion.p>

        <div
          style={{
            width: 'min(70vw, 320px)',
            aspectRatio: '2 / 3',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background:
                'radial-gradient(circle at 50% 50%, rgba(184,149,42,0.18) 0%, #111114 70%)',
              border: '1px solid rgba(184,149,42,0.4)',
            }}
          >
            <span
              className="font-display text-7xl italic text-casted-gold"
              style={{ textShadow: '0 0 40px rgba(184,149,42,0.4)' }}
            >
              C
            </span>
          </div>

          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: '#111114',
              border: '1px solid rgba(184,149,42,0.25)',
            }}
          >
            <PosterImage
              src={poster}
              alt={movie.title}
              title={movie.title}
              loading="eager"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: flipped ? 1 : 0, y: flipped ? 0 : 12 }}
          transition={{ duration: 0.6, delay: flipped ? 0.4 : 0, ease: 'easeOut' }}
          className="flex flex-col items-center"
          style={{ marginTop: '28px' }}
        >
          <h2 className="text-center font-display text-3xl italic text-casted-cream">
            {movie.title}
          </h2>
          <p
            className="font-body text-xs uppercase tracking-[0.3em] text-casted-gold/80"
            style={{ marginTop: '8px' }}
          >
            {year} {year && '·'} Casted Score {score}
          </p>

          <button
            type="button"
            onClick={() => onReveal(movie)}
            className="font-body text-xs uppercase tracking-widest text-casted-black"
            style={{
              marginTop: '24px',
              padding: '10px 28px',
              background: '#B8952A',
              border: '1px solid #B8952A',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = '#D4A843'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#D4A843'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = '#B8952A'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#B8952A'
            }}
          >
            See Details
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
