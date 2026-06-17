import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, Star, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import PosterImage from '../components/shared/PosterImage'
import { posterUrl } from '../lib/tmdb'
import { useTheater } from '../hooks/useTheater'
import { useDocTitle } from '../hooks/useDocTitle'
import type { TheaterMovie } from '../types'

type TheaterFilter = 'all' | 'watchlist' | 'watched'

export default function Theater() {
  useDocTitle('CASTED — Your Theater')
  const { theater, remove, toggleWatched, rate } = useTheater()
  const [confirmClear, setConfirmClear] = useState(false)
  const [filter, setFilter] = useState<TheaterFilter>('all')

  const count = theater.length
  const watchedCount = theater.filter((m) => m.watched).length
  const watchlistCount = count - watchedCount

  const sorted = [...theater].sort((a, b) => b.added_at - a.added_at)
  const filtered = sorted.filter((m) =>
    filter === 'all' ? true : filter === 'watched' ? !!m.watched : !m.watched,
  )

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    sorted.forEach((m, i) => {
      window.setTimeout(() => remove(m.id), i * 60)
    })
    setConfirmClear(false)
  }

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
            className="font-display text-6xl italic text-casted-cream"
          >
            Now Playing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="font-body text-sm uppercase"
            style={{
              marginTop: '12px',
              color: '#B8952A',
              letterSpacing: '0.3em',
            }}
          >
            In Your Theater
          </motion.p>
          <motion.span
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
            aria-hidden="true"
            style={{
              marginTop: '20px',
              width: '120px',
              height: '1px',
              background: '#B8952A',
              transformOrigin: 'center',
              display: 'block',
            }}
          />
        </div>

        {count === 0 ? (
          <EmptyState />
        ) : (
          <div
            className="flex w-full flex-col items-center"
            style={{ marginTop: '48px' }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="font-body text-xs uppercase tracking-widest"
              style={{ color: '#6B6B7A', marginBottom: '20px' }}
            >
              {count} {count === 1 ? 'Film' : 'Films'} · {watchedCount} Watched
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              style={{ marginBottom: '24px' }}
            >
              <FilterTabs
                value={filter}
                onChange={setFilter}
                counts={{ all: count, watchlist: watchlistCount, watched: watchedCount }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center"
              style={{ gap: '24px', marginBottom: '32px' }}
            >
              <AddMoreLink to="/cast-me">＋ Cast Me Again</AddMoreLink>
              <AddMoreLink to="/director">＋ Ask The Director</AddMoreLink>
            </motion.div>

            <div
              className="relative w-full"
              style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 clamp(12px, 4vw, 48px)',
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute"
                style={{
                  inset: 0,
                  background:
                    'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(184,149,42,0.03) 0%, transparent 70%)',
                }}
              />
              <div
                className="relative w-full"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '24px',
                }}
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((film, i) => (
                    <TheaterCard
                      key={film.id}
                      film={film}
                      index={i}
                      onRemove={() => remove(film.id)}
                      onToggleWatched={() => toggleWatched(film.id)}
                      onRate={(r) => rate(film.id, r)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {filtered.length === 0 && (
                <p
                  className="relative text-center font-display italic"
                  style={{ color: '#6B6B7A', padding: '48px 0' }}
                >
                  {filter === 'watched'
                    ? "You haven't marked anything watched yet."
                    : 'Nothing in your watchlist — everything here is watched.'}
                </p>
              )}
            </div>

            <button
              onClick={handleClearClick}
              onMouseLeave={() => setConfirmClear(false)}
              className="font-body text-xs uppercase tracking-widest transition-colors"
              style={{
                marginTop: '64px',
                background: 'transparent',
                border: 'none',
                color: confirmClear ? '#C0392B' : '#3A3A42',
                padding: '8px 0',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.color = '#C0392B'
              }}
            >
              {confirmClear ? 'Are you sure? Click again to confirm.' : 'Clear Theater'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative flex flex-1 flex-col items-center justify-center text-center"
      style={{ marginTop: '80px', minHeight: '40vh' }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: '600px',
          height: '600px',
          background:
            'radial-gradient(ellipse at center, rgba(184,149,42,0.12) 0%, transparent 60%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      <p className="relative font-display text-2xl italic text-casted-cream">
        Your theater is dark.
      </p>
      <p
        className="relative font-body text-sm"
        style={{ marginTop: '12px', color: '#6B6B7A' }}
      >
        Start adding films to light it up.
      </p>
      <Link
        to="/cast-me"
        className="relative font-body text-xs uppercase tracking-widest transition-all"
        style={{
          marginTop: '32px',
          padding: '12px 40px',
          background: 'transparent',
          border: '1px solid rgba(184,149,42,0.4)',
          color: '#F2ECD8',
          transitionDuration: '0.25s',
          transitionTimingFunction: 'ease',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(184,149,42,0.12)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#B8952A'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(184,149,42,0.4)'
        }}
      >
        Find Your First Film
      </Link>
    </motion.div>
  )
}

function AddMoreLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="font-body text-xs uppercase tracking-widest transition-colors"
      style={{
        color: '#4A4A55',
        borderBottom: '1px solid #3A3A42',
        paddingBottom: '2px',
        transitionDuration: '0.25s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.color = '#B8952A'
        ;(e.currentTarget as HTMLAnchorElement).style.borderBottomColor = '#B8952A'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.color = '#4A4A55'
        ;(e.currentTarget as HTMLAnchorElement).style.borderBottomColor = '#3A3A42'
      }}
    >
      {children}
    </Link>
  )
}

interface TheaterCardProps {
  film: TheaterMovie
  index: number
  onRemove: () => void
  onToggleWatched: () => void
  onRate: (rating: number) => void
}

function TheaterCard({ film, index, onRemove, onToggleWatched, onRate }: TheaterCardProps) {
  const [hovered, setHovered] = useState(false)
  const poster = posterUrl(film.poster_path, 'large')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: 'easeOut',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col"
      style={{ width: 'clamp(140px, 42vw, 200px)' }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: '2 / 3',
          width: '100%',
          border: hovered ? '1px solid rgba(184,149,42,0.5)' : '1px solid transparent',
          transition: 'border-color 0.3s ease',
        }}
      >
        <PosterImage
          src={poster}
          alt={film.title}
          title={film.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            filter: hovered ? 'brightness(0.7)' : 'brightness(1)',
            transition: 'filter 0.3s ease',
          }}
        />

        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label={`Remove ${film.title}`}
          className="absolute flex items-center justify-center text-casted-cream"
          style={{
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            background: 'rgba(10,10,11,0.7)',
            opacity: hovered ? 1 : 0,
            zIndex: 20,
            transition: 'opacity 0.3s ease',
          }}
        >
          <X size={14} strokeWidth={1.5} />
        </button>

        {film.watched && (
          <span
            aria-hidden="true"
            className="absolute flex items-center justify-center font-body uppercase"
            style={{
              top: '8px',
              left: '8px',
              gap: '4px',
              padding: '3px 8px',
              fontSize: '8px',
              letterSpacing: '0.2em',
              background: 'rgba(184,149,42,0.9)',
              color: '#0A0A0B',
              borderRadius: '9999px',
              zIndex: 20,
            }}
          >
            <Eye size={10} strokeWidth={2.5} /> Watched
          </span>
        )}

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end"
          style={{
            height: '60%',
            background:
              'linear-gradient(to top, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.7) 50%, transparent 100%)',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(20%)',
            transition: 'all 0.3s ease',
            padding: '16px',
            zIndex: 10,
          }}
        />
      </div>

      <p
        className="font-display italic text-sm truncate"
        style={{ color: '#F2ECD8', marginTop: '10px' }}
      >
        {film.title}
      </p>
      {film.year && (
        <p
          className="font-body text-xs"
          style={{ color: '#6B6B7A', marginTop: '2px' }}
        >
          {film.year}
        </p>
      )}

      <div style={{ marginTop: '8px' }}>
        <StarRating value={film.rating ?? 0} onRate={onRate} />
      </div>

      <button
        type="button"
        onClick={onToggleWatched}
        className="self-start font-body uppercase transition-colors"
        style={{
          marginTop: '8px',
          fontSize: '9px',
          letterSpacing: '0.2em',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: film.watched ? '#B8952A' : '#4A4A55',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.color = film.watched ? '#D4A843' : '#6B6B7A'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.color = film.watched ? '#B8952A' : '#4A4A55'
        }}
      >
        {film.watched ? '✓ Watched — move to watchlist' : 'Mark as watched'}
      </button>
    </motion.div>
  )
}

interface StarRatingProps {
  value: number
  onRate: (rating: number) => void
}

function StarRating({ value, onRate }: StarRatingProps) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div
      className="flex items-center"
      style={{ gap: '3px' }}
      onMouseLeave={() => setHover(0)}
      role="group"
      aria-label="Rate this film"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active
        return (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
            onMouseEnter={() => setHover(star)}
            onClick={() => onRate(star)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '1px',
              cursor: 'pointer',
              lineHeight: 0,
            }}
          >
            <Star
              size={14}
              strokeWidth={1.5}
              style={{
                color: filled ? '#B8952A' : 'rgba(242,236,216,0.25)',
                fill: filled ? '#B8952A' : 'transparent',
                transition: 'color 0.15s ease, fill 0.15s ease',
              }}
            />
          </button>
        )
      })}
    </div>
  )
}

interface FilterTabsProps {
  value: TheaterFilter
  onChange: (value: TheaterFilter) => void
  counts: { all: number; watchlist: number; watched: number }
}

function FilterTabs({ value, onChange, counts }: FilterTabsProps) {
  const tabs: { key: TheaterFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'watchlist', label: 'Watchlist', count: counts.watchlist },
    { key: 'watched', label: 'Watched', count: counts.watched },
  ]

  return (
    <div
      role="tablist"
      aria-label="Filter films"
      className="inline-flex items-center gap-1 rounded-full border border-casted-cream/10 bg-casted-black/70 px-1.5 py-1 backdrop-blur-sm"
    >
      {tabs.map((tab) => {
        const selected = value === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            className="rounded-full font-body uppercase transition-colors"
            style={{
              padding: '6px 14px',
              fontSize: '10px',
              letterSpacing: '0.25em',
              background: selected ? '#B8952A' : 'transparent',
              color: selected ? '#0A0A0B' : 'rgba(242,236,216,0.55)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label} {tab.count}
          </button>
        )
      })}
    </div>
  )
}
