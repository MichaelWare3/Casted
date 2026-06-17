import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import {
  castedScore,
  fetchPremiumPick,
  getDirector,
  getYear,
} from '../../lib/tmdb'
import { useTheater } from '../../hooks/useTheater'
import type { TMDBMovie, TMDBMovieDetails } from '../../types'

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original'

interface PremiumPickHeroProps {
  onOpen: (movie: TMDBMovie) => void
}

export default function PremiumPickHero({ onOpen }: PremiumPickHeroProps) {
  const [movie, setMovie] = useState<TMDBMovie | null>(null)
  const [details, setDetails] = useState<TMDBMovieDetails | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const { add, has } = useTheater()

  useEffect(() => {
    let cancelled = false
    fetchPremiumPick()
      .then((p) => {
        if (cancelled) return

        setMovie(p.movie)
        setDetails(p.details)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[CASTED] 👑 Premium Pick fetch failed:", err)
        setErrMsg(msg)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (errMsg) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: 'min(72vh, 720px)',
          background:
            'radial-gradient(ellipse at 50% 30%, #15151a 0%, #0a0a0b 70%)',
        }}
        className="flex flex-col items-center justify-center px-6 text-center"
      >
        <p className="font-body text-[10px] uppercase tracking-[0.45em] text-casted-gold/70">
          Premium Pick
        </p>
        <p className="mt-4 max-w-md font-display text-xl italic text-casted-cream/80">
          Could not load: {errMsg}
        </p>
        <p className="mt-2 font-body text-xs text-casted-cream/40">
          Check the browser console for details.
        </p>
      </div>
    )
  }

  if (!movie) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          minHeight: 'min(72vh, 720px)',
          background:
            'radial-gradient(ellipse at 50% 30%, #15151a 0%, #0a0a0b 70%)',
        }}
      />
    )
  }

  const backdrop = movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : null
  const dir = getDirector(details)
  const year = getYear(movie.release_date)
  const runtime = details?.runtime ? `${details.runtime} min` : ''
  const meta = [
    dir?.name ? `Directed by ${dir.name}` : null,
    year || null,
    runtime || null,
  ]
    .filter(Boolean)
    .join(' · ')
  const score = castedScore(movie)
  const saved = has(movie.id)

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
      onClick={() => onOpen(movie)}
      className="relative w-full overflow-hidden"
      style={{
        minHeight: 'min(72vh, 720px)',
        background: '#0a0a0b',
        cursor: 'pointer',
      }}
    >
      {backdrop && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <img
            src={backdrop}
            alt=""
            loading="eager"
            decoding="async"
            // @ts-expect-error fetchpriority is a valid newer HTML attribute not yet in React types
            fetchpriority="high"
            onError={(e) => {
              // Decorative backdrop — hide it rather than show a broken icon.
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
            className="h-full w-full object-cover"
            style={{
              filter: 'brightness(0.92) contrast(1.08) saturate(1.06)',
              imageRendering: 'auto',
            }}
          />
        </motion.div>
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,10,11,0.45) 0%, rgba(10,10,11,0.08) 28%, rgba(10,10,11,0.32) 62%, rgba(10,10,11,0.97) 100%)',
        }}
      />

      <div
        className="absolute"
        style={{ top: 'clamp(96px, 14vh, 132px)', left: 'clamp(24px, 5vw, 48px)' }}
      >
        <motion.span
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="inline-flex items-center font-body text-[10px] uppercase tracking-[0.45em] text-casted-gold"
          style={{
            padding: '7px 14px',
            border: '1px solid rgba(184,149,42,0.5)',
            background: 'rgba(10,10,11,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          Premium Pick
        </motion.span>
      </div>

      <div
        className="relative mx-auto flex h-full w-full max-w-7xl flex-col justify-end"
        style={{
          minHeight: 'min(72vh, 720px)',
          padding: 'clamp(24px, 5vw, 56px)',
          paddingBottom: 'clamp(40px, 7vh, 72px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: 'easeOut' }}
          className="flex flex-col"
        >
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <h2
              className="font-display italic leading-[0.95] text-casted-cream"
              style={{ fontSize: 'clamp(2.75rem, 6vw, 5.5rem)' }}
            >
              {movie.title}
            </h2>
            <div
              className="flex flex-col items-center"
              style={{
                padding: '8px 16px',
                border: '1px solid rgba(184,149,42,0.5)',
                color: '#B8952A',
                background: 'rgba(10,10,11,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                marginBottom: '10px',
              }}
            >
              <span className="font-body text-[9px] uppercase tracking-[0.3em] opacity-70">
                Casted
              </span>
              <span className="font-display text-xl italic">{score}</span>
            </div>
          </div>

          {meta && (
            <p
              className="font-body text-xs uppercase tracking-[0.3em] text-casted-cream/75 sm:text-sm"
              style={{ marginTop: '18px' }}
            >
              {meta}
            </p>
          )}

          <div
            className="flex flex-wrap items-center"
            style={{ marginTop: '28px', gap: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={saved}
              onClick={() => {
                if (!saved) add(movie)
              }}
              className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-widest"
              style={{
                padding: '10px 22px',
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

            <button
              type="button"
              onClick={() => onOpen(movie)}
              className="inline-flex items-center font-body text-xs uppercase tracking-widest text-casted-black"
              style={{
                padding: '10px 26px',
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
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}
