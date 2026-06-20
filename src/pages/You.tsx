import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Share2, Star } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import CharacterTile from '../components/identity/CharacterTile'
import IdentityCardModal from '../components/identity/IdentityCardModal'
import PosterImage from '../components/shared/PosterImage'
import { posterUrl } from '../lib/tmdb'
import { useTheater } from '../hooks/useTheater'
import { useAuth } from '../hooks/useAuth'
import AuthModal from '../components/auth/AuthModal'
import { useDocTitle } from '../hooks/useDocTitle'
import { getCastCharacters, identityLine, fingerprintTags } from '../lib/identity'
import type { IdentityCardData } from '../lib/identityCard'
import type { TheaterMovie } from '../types'

export default function You() {
  useDocTitle('CASTED — Your Cinema')
  const { theater } = useTheater()
  const { enabled, user, signOut } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  const cast = useMemo(() => getCastCharacters(), [])
  const line = useMemo(() => identityLine(cast), [cast])
  const fingerprint = useMemo(() => fingerprintTags(cast), [cast])

  const watched = theater.filter((m) => m.watched)
  const rated = theater.filter((m) => typeof m.rating === 'number')
  const avg = rated.length
    ? (rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length).toFixed(1)
    : '—'
  const loved = [...theater]
    .filter((m) => (m.rating ?? 0) >= 4)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))

  const isEmpty = cast.length === 0 && theater.length === 0
  const [cardOpen, setCardOpen] = useState(false)

  const cardData: IdentityCardData = {
    line,
    traits: fingerprint,
    characters: cast.slice(0, 3).map((c) => c.name),
    lovedTitles: loved.slice(0, 3).map((f) => f.title),
    stats: { films: theater.length, watched: watched.length, cast: cast.length },
  }

  return (
    <div className="relative min-h-screen bg-casted-black">
      <Navbar />

      <main
        className="relative flex min-h-screen w-full flex-col items-center px-6 pb-24"
        style={{ paddingTop: '120px' }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[12vh] -translate-x-1/2 rounded-full"
          style={{
            width: '70vh',
            height: '70vh',
            background: 'radial-gradient(circle, rgba(184,149,42,0.05) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Hero */}
        <div className="relative flex w-full max-w-4xl flex-col items-center text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-body text-[10px] uppercase tracking-[0.5em] text-casted-gold/70"
          >
            Your Cinematic Identity
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="mt-4 font-display text-5xl italic text-casted-cream sm:text-6xl"
          >
            Your Cinema
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: 'easeOut' }}
            className="mt-5 font-display text-xl italic text-casted-gold/90 sm:text-2xl"
          >
            {line}
          </motion.p>
          <motion.span
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            aria-hidden="true"
            className="mt-8 block h-px w-28 origin-center bg-casted-gold"
          />

          {!isEmpty && (
            <motion.button
              type="button"
              onClick={() => setCardOpen(true)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="mt-8 inline-flex items-center gap-2 font-body text-xs uppercase tracking-widest text-casted-black transition-transform hover:scale-[1.03]"
              style={{ padding: '11px 26px', background: '#B8952A', border: '1px solid #B8952A' }}
            >
              <Share2 size={13} strokeWidth={2} />
              Share My Cinema
            </motion.button>
          )}

          {enabled &&
            (user ? (
              <p className="mt-5 font-body text-[11px] text-casted-muted">
                Synced as {user.email}
                <span className="mx-2 text-casted-gold/40">·</span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="uppercase tracking-widest transition-colors hover:text-casted-cream"
                >
                  Sign out
                </button>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="mt-5 font-body text-[11px] uppercase tracking-[0.25em] text-casted-gold/80 transition-colors hover:text-casted-gold"
              >
                Sign in to sync across devices
              </button>
            ))}
        </div>

        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="relative mt-14 flex w-full max-w-6xl flex-col" style={{ gap: '64px' }}>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="In Your Theater" value={String(theater.length)} />
              <Stat label="Watched" value={String(watched.length)} />
              <Stat label="Avg Rating" value={avg === '—' ? '—' : `${avg}★`} />
              <Stat label="Times Cast" value={String(cast.length)} />
            </div>

            {/* Taste fingerprint */}
            {fingerprint.length > 0 && (
              <section>
                <SectionLabel>Your Taste</SectionLabel>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {fingerprint.map((tag) => (
                    <span
                      key={tag}
                      className="font-body text-xs uppercase tracking-[0.2em] text-casted-gold"
                      style={{
                        padding: '7px 16px',
                        border: '1px solid rgba(184,149,42,0.4)',
                        borderRadius: '9999px',
                        background: 'rgba(184,149,42,0.06)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Cast characters */}
            {cast.length > 0 && (
              <section>
                <SectionLabel>You’ve Been Cast As</SectionLabel>
                <div
                  className="mt-6 grid"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}
                >
                  {cast.map((c, i) => (
                    <CharacterTile key={c.id} character={c} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Most loved */}
            <section>
              <SectionLabel>Most Loved</SectionLabel>
              {loved.length > 0 ? (
                <div
                  className="mt-6 grid"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}
                >
                  {loved.map((film, i) => (
                    <LovedFilm key={film.id} film={film} index={i} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 font-display text-lg italic text-casted-cream/60">
                  Rate films 4★ or higher in your Theater and your favorites gather here.
                </p>
              )}
            </section>
          </div>
        )}
      </main>

      <AnimatePresence>
        {cardOpen && <IdentityCardModal data={cardData} onClose={() => setCardOpen(false)} />}
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        padding: '20px 12px',
        border: '1px solid rgba(184,149,42,0.15)',
        background: 'rgba(184,149,42,0.03)',
      }}
    >
      <span className="font-display text-3xl italic text-casted-cream sm:text-4xl">{value}</span>
      <span className="mt-2 font-body text-[9px] uppercase tracking-[0.25em] text-casted-muted">
        {label}
      </span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-body text-[11px] uppercase tracking-[0.4em] text-casted-gold/80">
      {children}
    </h2>
  )
}

function LovedFilm({ film, index }: { film: TheaterMovie; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5), ease: 'easeOut' }}
      className="group flex flex-col"
    >
      <div
        className="relative overflow-hidden border border-white/[0.06]"
        style={{ aspectRatio: '2 / 3' }}
      >
        <PosterImage
          src={posterUrl(film.poster_path, 'medium')}
          alt={film.title}
          title={film.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {typeof film.rating === 'number' && (
          <div
            className="absolute right-2 top-2 flex items-center gap-1"
            style={{
              padding: '3px 7px',
              background: 'rgba(10,10,11,0.75)',
              border: '1px solid rgba(184,149,42,0.4)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Star size={11} style={{ color: '#B8952A', fill: '#B8952A' }} />
            <span className="font-body text-[11px] text-casted-gold">{film.rating}</span>
          </div>
        )}
      </div>
      <p className="mt-2 truncate font-display text-sm italic text-casted-cream">{film.title}</p>
      {film.year && (
        <p className="font-body text-[10px] uppercase tracking-widest text-casted-muted">
          {film.year}
        </p>
      )}
    </motion.div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative mt-16 flex flex-col items-center text-center"
      style={{ minHeight: '30vh' }}
    >
      <p className="font-display text-2xl italic text-casted-cream/80">
        Your cinema is a blank reel.
      </p>
      <p className="mt-3 max-w-md font-body text-sm text-casted-muted">
        Get cast as a character and start rating films — your identity builds itself from here.
      </p>
      <Link
        to="/cast-me"
        className="mt-8 font-body text-xs uppercase tracking-widest transition-all"
        style={{
          padding: '12px 40px',
          border: '1px solid rgba(184,149,42,0.5)',
          color: '#F2ECD8',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(184,149,42,0.12)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#B8952A'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(184,149,42,0.5)'
        }}
      >
        Cast Me
      </Link>
    </motion.div>
  )
}
