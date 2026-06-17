import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Plus, X } from 'lucide-react'
import PosterImage from '../shared/PosterImage'
import WhereToWatch from '../shared/WhereToWatch'
import {
  castedScore,
  fetchDirectorFilms,
  fetchMovieDetails,
  getDirector,
  getYear,
  posterUrl,
} from '../../lib/tmdb'
import { useTheater } from '../../hooks/useTheater'
import type { TMDBMovie, TMDBMovieDetails } from '../../types'

interface DetailModalProps {
  movie: TMDBMovie
  onClose: () => void
  onOpen: (movie: TMDBMovie) => void
}

const COUNTRY_BY_LANG: Record<string, string> = {
  en: 'United States / UK',
  fr: 'France',
  ko: 'Korea',
  ja: 'Japan',
  it: 'Italy',
  es: 'Spain / Latin America',
  de: 'Germany',
  da: 'Denmark',
}

export default function DetailModal({ movie, onClose, onOpen }: DetailModalProps) {
  const [details, setDetails] = useState<TMDBMovieDetails | null>(null)
  const [directorFilms, setDirectorFilms] = useState<TMDBMovie[]>([])
  const { add, has } = useTheater()
  const saved = has(movie.id)

  useEffect(() => {
    let cancelled = false
    setDetails(null)
    setDirectorFilms([])

    fetchMovieDetails(movie.id).then(async (d) => {
      if (cancelled) return
      setDetails(d)
      const dir = getDirector(d)
      if (!dir) return
      const films = await fetchDirectorFilms(dir.id, movie.id)
      if (cancelled) return
      setDirectorFilms(films)
    })

    return () => {
      cancelled = true
    }
  }, [movie.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const dir = getDirector(details)
  const lang = details?.original_title ? (details as TMDBMovieDetails & { original_language?: string }).original_language : undefined
  const country = lang ? COUNTRY_BY_LANG[lang] ?? lang.toUpperCase() : ''
  const runtime = details?.runtime ? `${details.runtime} min` : ''
  const year = getYear(movie.release_date)
  const score = castedScore(movie)
  const poster = posterUrl(movie.poster_path, 'large')

  const meta = [
    dir?.name ? `Directed by ${dir.name}` : null,
    year || null,
    runtime || null,
    country || null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-8"
      style={{ background: 'rgba(10,10,11,0.97)' }}
    >
      <button
        onClick={onClose}
        className="fixed right-6 top-6 z-[110] flex h-10 w-10 items-center justify-center text-casted-cream transition-colors hover:text-casted-gold"
        aria-label="Close"
      >
        <X size={22} strokeWidth={1.5} />
      </button>

      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl"
        style={{
          background: '#111114',
          border: '1px solid rgba(184,149,42,0.15)',
        }}
      >
        <div className="flex flex-col sm:flex-row">
          <div
            className="flex-shrink-0 overflow-hidden"
            style={{ width: '100%', maxWidth: '280px', aspectRatio: '2 / 3' }}
          >
            <PosterImage
              src={poster}
              alt={movie.title}
              title={movie.title}
              loading="eager"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-1 flex-col p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-3xl italic leading-tight text-casted-cream sm:text-4xl">
                {movie.title}
              </h2>
              <div
                className="flex flex-col items-center"
                style={{
                  padding: '8px 14px',
                  border: '1px solid rgba(184,149,42,0.4)',
                  color: '#B8952A',
                }}
              >
                <span className="font-body text-[9px] uppercase tracking-[0.3em] opacity-70">
                  Casted
                </span>
                <span className="font-display text-xl italic">{score}</span>
              </div>
            </div>

            {meta && (
              <p className="mt-2 font-body text-sm" style={{ color: '#6B6B7A' }}>
                {meta}
              </p>
            )}

            {movie.overview && (
              <p
                className="mt-4 font-body text-sm leading-relaxed text-casted-cream/80"
              >
                {movie.overview}
              </p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                disabled={saved}
                onClick={() => add(movie)}
                className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-widest"
                style={{
                  padding: '8px 20px',
                  background: saved ? '#B8952A' : 'transparent',
                  border: '1px solid #B8952A',
                  color: saved ? '#0A0A0B' : '#B8952A',
                  cursor: saved ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {saved ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2} />}
                {saved ? 'In Theater' : 'Add to Theater'}
              </button>
            </div>

            <div className="mt-8">
              <WhereToWatch movieId={movie.id} />
            </div>
          </div>
        </div>

        {dir && directorFilms.length > 0 && (
          <div
            className="border-t px-6 py-6 sm:px-8"
            style={{ borderColor: 'rgba(184,149,42,0.12)' }}
          >
            <p className="font-body text-[10px] uppercase tracking-[0.35em] text-casted-gold/80">
              More from {dir.name}
            </p>
            <div
              className="mt-4 grid"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '12px',
              }}
            >
              {directorFilms.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onOpen(f)}
                  className="group relative block overflow-hidden text-left"
                  style={{ aspectRatio: '2 / 3', background: '#0A0A0B', cursor: 'pointer' }}
                >
                  <PosterImage
                    src={posterUrl(f.poster_path, 'medium')}
                    alt={f.title}
                    title={f.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
