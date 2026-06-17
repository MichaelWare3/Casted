import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import PosterImage from '../shared/PosterImage'
import { castedScore, getYear, posterUrl } from '../../lib/tmdb'
import { useTheater } from '../../hooks/useTheater'
import type { TMDBMovie } from '../../types'

interface PosterCardProps {
  movie: TMDBMovie
  index: number
  onOpen: (movie: TMDBMovie) => void
}

export default function PosterCard({ movie, index, onOpen }: PosterCardProps) {
  const { add, has } = useTheater()
  const saved = has(movie.id)
  const [hover, setHover] = useState(false)
  const poster = posterUrl(movie.poster_path, 'medium')
  const score = castedScore(movie)
  const year = getYear(movie.release_date)

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(movie)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: Math.min(index * 0.03, 0.6) }}
      className="group relative block w-full overflow-hidden text-left"
      style={{
        aspectRatio: '2 / 3',
        background: '#111114',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <PosterImage
        src={poster}
        alt={movie.title}
        title={movie.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          transform: hover ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,11,0) 35%, rgba(10,10,11,0.55) 70%, rgba(10,10,11,0.92) 100%)',
          opacity: hover ? 1 : 0.6,
          transition: 'opacity 0.3s ease',
        }}
      />

      <div
        className="absolute left-2 top-2 flex items-center font-body text-[10px] uppercase tracking-widest"
        style={{
          padding: '4px 8px',
          background: 'rgba(10,10,11,0.75)',
          border: '1px solid rgba(184,149,42,0.4)',
          color: '#B8952A',
          backdropFilter: 'blur(4px)',
        }}
      >
        {score}
      </div>

      <button
        type="button"
        aria-label={saved ? 'Already in Theater' : 'Save to Theater'}
        onClick={(e) => {
          e.stopPropagation()
          if (!saved) add(movie)
        }}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center"
        style={{
          background: saved ? '#B8952A' : 'rgba(10,10,11,0.75)',
          border: saved ? '1px solid #B8952A' : '1px solid rgba(184,149,42,0.4)',
          color: saved ? '#0A0A0B' : '#B8952A',
          backdropFilter: 'blur(4px)',
          cursor: saved ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {saved ? <Check size={13} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2} />}
      </button>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col px-3 pb-3"
        style={{
          opacity: hover ? 1 : 0,
          transform: hover ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <p className="font-display text-base italic leading-tight text-casted-cream line-clamp-2">
          {movie.title}
        </p>
        <p className="mt-1 font-body text-[10px] uppercase tracking-widest text-casted-gold/80">
          {year}
        </p>
        {movie.overview && (
          <p
            className="mt-2 font-body text-[11px] leading-snug text-casted-cream/75 line-clamp-2"
          >
            {movie.overview}
          </p>
        )}
      </div>
    </motion.button>
  )
}
