import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus, X } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import LoadingDots from '../components/shared/LoadingDots'
import ErrorState from '../components/shared/ErrorState'
import PosterImage from '../components/shared/PosterImage'
import WhereToWatch from '../components/shared/WhereToWatch'
import {
  fetchHiddenGem,
  fetchMovieDetails,
  fetchMovieTrailer,
  getDirectorName,
  getYear,
  posterUrl,
} from '../lib/tmdb'
import { getDailySeed, getFallbackDrop } from '../lib/dropFilms'
import { generateDropClue } from '../lib/claude'
import { useTheater } from '../hooks/useTheater'
import { useDocTitle } from '../hooks/useDocTitle'
import type { TMDBMovieDetails, TMDBVideo } from '../types'

type Phase = 'loading-details' | 'sealed' | 'revealed' | 'error'

function formatDropDate(d: Date): string {
  const day = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
  return `${day}, ${month} ${d.getDate()}`
}

function formatVoteCount(n: number | undefined): string {
  if (!n || n <= 0) return ''
  return n.toLocaleString('en-US')
}

function msUntilMidnight(now: Date): number {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return Math.max(0, next.getTime() - now.getTime())
}

function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}H ${pad(m)}M ${pad(s)}S`
}

function useCountdownToMidnight(): string {
  const [label, setLabel] = useState<string>(() => formatCountdown(msUntilMidnight(new Date())))
  useEffect(() => {
    const tick = () => setLabel(formatCountdown(msUntilMidnight(new Date())))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  return label
}

export default function Drop() {
  useDocTitle('CASTED — Daily Drop')
  const today = useMemo(() => new Date(), [])
  const seed = useMemo(() => getDailySeed(today), [today])
  const dateLabel = useMemo(() => formatDropDate(today), [today])

  const countdown = useCountdownToMidnight()
  const [phase, setPhase] = useState<Phase>('loading-details')
  const [details, setDetails] = useState<TMDBMovieDetails | null>(null)
  const [clue, setClue] = useState<string>('')
  const [moodTags, setMoodTags] = useState<string[]>([])
  const [trailer, setTrailer] = useState<TMDBVideo | null>(null)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        let film: TMDBMovieDetails | null = null
        try {
          film = await fetchHiddenGem(seed)
        } catch (err) {
          console.warn('[CASTED] 🎲 fetchHiddenGem threw, falling back', err)
          film = null
        }

        let fallbackTags: string[] = []
        if (!film) {
          const fallback = getFallbackDrop(seed)
          fallbackTags = fallback.mood_tags
          film = await fetchMovieDetails(fallback.tmdb_id)
        }
        if (!alive) return
        if (!film) {
          setErrMsg('Could not load tonight’s film.')
          setPhase('error')
          return
        }

        const [t, clueResult] = await Promise.all([
          fetchMovieTrailer(film.id).catch(() => null),
          generateDropClue({
            title: film.title,
            overview: film.overview ?? '',
            year: getYear(film.release_date),
          }).catch((err) => {
            console.warn('[CASTED] 🪶 clue generation failed', err)
            return null
          }),
        ])
        if (!alive) return

        setDetails(film)
        setTrailer(t)
        setClue(clueResult?.clue ?? 'A film almost no one has seen. Tonight, you do.')
        setMoodTags(
          clueResult?.mood_tags && clueResult.mood_tags.length > 0
            ? clueResult.mood_tags
            : fallbackTags.length > 0
              ? fallbackTags
              : ['Hidden Gem', 'Underseen', 'Discovery'],
        )
        setPhase('sealed')
      } catch (e) {
        if (!alive) return
        setErrMsg(e instanceof Error ? e.message : 'Something went wrong.')
        setPhase('error')
      }
    })()
    return () => {
      alive = false
    }
  }, [seed])

  return (
    <div className="relative min-h-screen bg-casted-black">
      <Navbar />

      <main
        className="relative flex min-h-screen w-full flex-col items-center px-6 pb-24"
        style={{ paddingTop: '120px' }}
      >
        <div className="flex w-full flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="font-display text-5xl italic tracking-tight text-casted-cream"
          >
            The Daily Drop
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="font-body text-sm uppercase tracking-widest"
            style={{ marginTop: '12px', color: '#6B6B7A' }}
          >
            {dateLabel}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
            className="flex items-center font-body text-xs uppercase tracking-widest"
            style={{ marginTop: '20px', color: '#6B6B7A', gap: '8px' }}
          >
            <span
              aria-hidden="true"
              className="drop-dot-pulse inline-block"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '9999px',
                background: '#B8952A',
              }}
            />
            Next Drop In {countdown}
          </motion.p>
        </div>

        <div
          className="relative flex w-full justify-center"
          style={{ marginTop: '20px' }}
        >
          <AnimatePresence mode="wait">
            {phase === 'revealed' && details ? (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="w-[90%]"
                style={{ maxWidth: '720px' }}
              >
                <RevealedCard
                  clue={clue}
                  moodTags={moodTags}
                  details={details}
                  trailer={trailer}
                  onTrailer={() => setTrailerOpen(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="sealed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="relative w-[90%]"
                style={{
                  maxWidth: '580px',
                  background: 'rgba(10,10,11,0.6)',
                  border: '1px solid rgba(184,149,42,0.06)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: '2px',
                  padding: '48px',
                }}
              >
                {phase === 'error' ? (
                  <ErrorState
                    message={errMsg || 'Something went wrong. Try again.'}
                    onRetry={() => window.location.reload()}
                  />
                ) : (
                  <SealedCard
                    clue={clue}
                    moodTags={moodTags}
                    loading={phase === 'loading-details'}
                    onReveal={() => setPhase('revealed')}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {trailerOpen && trailer && (
          <TrailerModal videoKey={trailer.key} onClose={() => setTrailerOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

interface SealedCardProps {
  clue: string
  moodTags: string[]
  loading: boolean
  onReveal: () => void
}

function SealedCard({ clue, moodTags, loading, onReveal }: SealedCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center" style={{ gap: '16px' }}>
        <span
          aria-hidden="true"
          style={{
            width: '40px',
            height: '1px',
            background: 'rgba(184,149,42,0.3)',
            display: 'inline-block',
          }}
        />
        <p
          className="font-display italic text-sm"
          style={{ color: '#B8952A' }}
        >
          Tonight’s Film
        </p>
        <span
          aria-hidden="true"
          style={{
            width: '40px',
            height: '1px',
            background: 'rgba(184,149,42,0.3)',
            display: 'inline-block',
          }}
        />
      </div>

      <div
        className="flex flex-wrap items-center justify-center"
        style={{ marginTop: '24px', gap: '12px' }}
      >
        {moodTags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="font-body text-[10px] uppercase tracking-widest text-[#B8952A]"
            style={{
              padding: '4px 12px',
              border: '1px solid rgba(184,149,42,0.4)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div
        className="flex items-center justify-center"
        style={{ margin: '32px 0', minHeight: '3.6rem' }}
      >
        {loading ? (
          <LoadingDots />
        ) : (
          <p
            className="font-display italic text-casted-cream"
            style={{ fontSize: '1.5rem', lineHeight: 1.8 }}
          >
            {clue}
          </p>
        )}
      </div>

      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          width: '160px',
          height: '240px',
          background: 'rgba(184,149,42,0.06)',
          border: '1px solid rgba(184,149,42,0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <span
          className="font-display italic text-8xl drop-qmark-sway"
          style={{ color: 'rgba(184,149,42,0.15)' }}
        >
          ?
        </span>
      </div>

      <div
        className="relative inline-block"
        style={{ marginTop: '32px' }}
      >
        <span
          aria-hidden="true"
          className="drop-reveal-glow pointer-events-none absolute inset-0 -mx-10 -my-8"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(184,149,42,1) 0%, transparent 65%)',
          }}
        />
        <button
          disabled={loading}
          onClick={onReveal}
          className="relative font-body text-sm uppercase tracking-widest transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            padding: '16px 64px',
            background: 'transparent',
            border: '1px solid rgba(184,149,42,0.3)',
            color: '#F2ECD8',
            borderRadius: 0,
          }}
          onMouseEnter={(e) => {
            if (loading) return
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(184,149,42,0.08)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#B8952A'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(184,149,42,0.3)'
          }}
        >
          {loading ? 'Loading…' : 'Reveal the Film'}
        </button>
      </div>
    </div>
  )
}

interface RevealedCardProps {
  clue: string
  moodTags: string[]
  details: TMDBMovieDetails
  trailer: TMDBVideo | null
  onTrailer: () => void
}

function RevealedCard({ clue, moodTags, details, trailer, onTrailer }: RevealedCardProps) {
  const { add, has } = useTheater()
  const inTheater = has(details.id)
  const poster = posterUrl(details.poster_path, 'large')
  const director = getDirectorName(details)
  const year = getYear(details.release_date)
  const runtime = details.runtime ? `${details.runtime} min` : ''
  const voteCount = formatVoteCount(details.vote_count)
  const metaLine = [
    director ? `Directed by ${director}` : null,
    year || null,
    runtime || null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex flex-col items-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="font-body text-[10px] uppercase tracking-widest"
        style={{ color: '#B8952A', marginBottom: '8px' }}
      >
        The clue was
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="font-display italic text-center"
        style={{
          color: '#A89F8C',
          fontSize: '0.95rem',
          maxWidth: '480px',
          marginBottom: '32px',
        }}
      >
        “{clue}”
      </motion.p>

      <div className="flex flex-col items-center sm:flex-row sm:items-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="flex-shrink-0 overflow-hidden"
          style={{
            width: '220px',
            height: '330px',
            border: '1px solid rgba(184,149,42,0.2)',
          }}
        >
          <PosterImage
            src={poster}
            alt={details.title}
            title={details.title}
            loading="eager"
            className="h-full w-full object-cover"
          />
        </motion.div>

        <div className="flex flex-1 flex-col text-left max-sm:mt-6 max-sm:pl-0 max-sm:text-center sm:pl-8">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
            className="font-display text-4xl italic leading-tight text-casted-cream"
          >
            {details.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-2 font-body text-sm"
            style={{ color: '#6B6B7A' }}
          >
            {metaLine}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="flex flex-wrap max-sm:justify-center"
            style={{ marginTop: '16px', gap: '8px' }}
          >
            {moodTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="font-body text-[10px] uppercase tracking-widest text-[#B8952A]"
                style={{
                  padding: '4px 12px',
                  border: '1px solid rgba(184,149,42,0.4)',
                }}
              >
                {tag}
              </span>
            ))}
          </motion.div>

          {details.overview && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="font-display text-base italic"
              style={{
                color: '#8A8A96',
                lineHeight: 1.8,
                marginTop: '20px',
              }}
            >
              {details.overview}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.7 }}
            className="flex flex-wrap items-center max-sm:justify-center"
            style={{ marginTop: '28px', gap: '12px' }}
          >
            <button
              disabled={!trailer}
              onClick={onTrailer}
              className="font-body text-xs uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                padding: '12px 40px',
                background: 'transparent',
                border: '1px solid rgba(184,149,42,0.4)',
                color: '#F2ECD8',
                borderRadius: 0,
                transitionDuration: '0.25s',
                transitionTimingFunction: 'ease',
              }}
              onMouseEnter={(e) => {
                if (!trailer) return
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(184,149,42,0.12)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#B8952A'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(184,149,42,0.4)'
              }}
            >
              {trailer ? 'Watch Trailer' : 'No Trailer'}
            </button>
            <button
              disabled={inTheater}
              onClick={() =>
                add({
                  id: details.id,
                  title: details.title,
                  poster_path: details.poster_path,
                  release_date: details.release_date,
                })
              }
              className="inline-flex items-center font-body text-xs uppercase tracking-widest transition-all disabled:opacity-50"
              style={{
                padding: '12px 40px',
                background: 'transparent',
                border: '1px solid rgba(184,149,42,0.2)',
                color: '#A89F8C',
                borderRadius: 0,
                gap: '6px',
                transitionDuration: '0.25s',
                transitionTimingFunction: 'ease',
              }}
              onMouseEnter={(e) => {
                if (inTheater) return
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#F2ECD8'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#F2ECD8'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(184,149,42,0.2)'
                ;(e.currentTarget as HTMLButtonElement).style.color = '#A89F8C'
              }}
            >
              {inTheater ? <Check size={12} /> : <Plus size={12} />}
              {inTheater ? 'In Theater' : 'Add to Theater'}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.9 }}
            className="max-sm:flex max-sm:justify-center"
            style={{ marginTop: '32px' }}
          >
            <WhereToWatch movieId={details.id} />
          </motion.div>
        </div>
      </div>

      {voteCount && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.9 }}
          className="font-display italic text-sm text-center"
          style={{
            marginTop: '36px',
            paddingTop: '24px',
            width: '300px',
            borderTop: '1px solid rgba(184,149,42,0.15)',
            color: '#B8952A',
          }}
        >
          Only {voteCount} people on Earth have logged this film.
        </motion.p>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.1 }}
        className="font-display italic"
        style={{
          marginTop: '24px',
          color: '#4A4A55',
          fontSize: '0.875rem',
        }}
      >
        Come back tomorrow for the next drop.
      </motion.p>
    </div>
  )
}

interface TrailerModalProps {
  videoKey: string
  onClose: () => void
}

function TrailerModal({ videoKey, onClose }: TrailerModalProps) {
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
        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center text-casted-cream transition-colors hover:text-[#B8952A]"
        aria-label="Close trailer"
      >
        <X size={22} />
      </button>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-[90%] overflow-hidden"
        style={{
          maxWidth: '900px',
          aspectRatio: '16 / 9',
          border: '1px solid rgba(184,149,42,0.25)',
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
          title="Trailer"
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </motion.div>
    </motion.div>
  )
}
