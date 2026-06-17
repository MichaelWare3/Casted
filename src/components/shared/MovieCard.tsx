import { motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import { posterUrl, getYear } from '../../lib/tmdb'
import PosterImage from './PosterImage'
import { useTheater } from '../../hooks/useTheater'
import type { TMDBMovie } from '../../types'

interface MovieCardProps {
  movie: TMDBMovie
  vibeTags?: string[]
  index?: number
}

export default function MovieCard({ movie, vibeTags, index = 0 }: MovieCardProps) {
  const { add, has } = useTheater()
  const inTheater = has(movie.id)
  const poster = posterUrl(movie.poster_path)
  const year = getYear(movie.release_date)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col"
    >
      <div
        className="relative aspect-[2/3] overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-[12px] transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.04] group-hover:border-[rgba(184,149,42,0.5)] group-hover:shadow-[0_18px_50px_-12px_rgba(184,149,42,0.45)]"
      >
        <PosterImage
          src={poster}
          alt={movie.title}
          title={movie.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-casted-black/95 via-casted-black/20 to-transparent opacity-90" />

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            if (!inTheater) add(movie)
          }}
          aria-label={inTheater ? 'In your theater' : 'Add to theater'}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center border backdrop-blur-sm transition-all duration-300 ${
            inTheater
              ? 'border-casted-gold bg-casted-gold/20 text-casted-gold'
              : 'border-casted-cream/30 bg-casted-black/60 text-casted-cream hover:border-casted-gold hover:text-casted-gold'
          }`}
        >
          {inTheater ? <Check size={16} /> : <Plus size={16} />}
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-lg italic leading-tight text-casted-cream">
            {movie.title}
          </h3>
          {year && (
            <p className="mt-1 font-body text-xs uppercase tracking-[0.2em] text-casted-muted">
              {year}
            </p>
          )}
        </div>
      </div>

      {vibeTags && vibeTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {vibeTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="border border-casted-gold/30 px-2 py-0.5 font-body text-[10px] uppercase tracking-[0.15em] text-casted-gold/80"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
