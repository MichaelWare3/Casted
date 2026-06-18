import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronDown, RotateCcw, Share2 } from 'lucide-react'
import MovieCard from '../shared/MovieCard'
import PosterImage from '../shared/PosterImage'
import ShareCardModal from './ShareCardModal'
import { fetchCharacterMedia } from '../../lib/tmdb'
import type { AlterEgoCharacter, TMDBMovie } from '../../types'

interface EgoRevealProps {
  character: AlterEgoCharacter
  movies: TMDBMovie[]
  moviesLoading: boolean
  onRestart: () => void
}

export default function EgoReveal({ character, movies, moviesLoading, onRestart }: EgoRevealProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const [backdrop, setBackdrop] = useState<string | null>(null)
  const [portrait, setPortrait] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchCharacterMedia(character.film_of_origin, character.year, character.actor_name ?? '')
      .then((media) => {
        if (cancelled) return
        setBackdrop(media.backdrop ?? media.profile)
        setPortrait(media.poster ?? media.profile)
      })
      .catch((err) => {
        console.warn('[CASTED] character media fetch failed', err)
      })
    return () => {
      cancelled = true
    }
  }, [character.film_of_origin, character.year, character.actor_name])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9 }}
      className="relative min-h-screen bg-casted-black"
    >
      {backdrop && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: 0 }}
        >
          <img
            src={backdrop}
            alt=""
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
            className="h-full w-full object-cover"
            style={{
              filter: 'grayscale(30%) brightness(0.28) contrast(1.3)',
              mixBlendMode: 'luminosity',
              WebkitMaskImage:
                'radial-gradient(ellipse 70% 80% at 50% 40%, black 10%, transparent 75%)',
              maskImage:
                'radial-gradient(ellipse 70% 80% at 50% 40%, black 10%, transparent 75%)',
            }}
          />
        </motion.div>
      )}

      <div className="pointer-events-none fixed inset-0" style={{ zIndex: 1 }}>
        <div className="absolute left-1/2 top-[15vh] h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-casted-gold/[0.04] blur-[140px]" />
      </div>

      <section
        className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-20 text-center"
        style={{ zIndex: 10 }}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '60vh',
            height: '60vh',
            borderRadius: '9999px',
            background:
              'radial-gradient(circle, rgba(184,149,42,0.18) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
          animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative mb-10 overflow-hidden"
          style={{
            width: 'clamp(150px, 42vw, 196px)',
            aspectRatio: '2 / 3',
            border: '1px solid rgba(184,149,42,0.45)',
            boxShadow:
              '0 20px 60px -15px rgba(0,0,0,0.75), 0 0 44px -10px rgba(184,149,42,0.4)',
          }}
        >
          <PosterImage
            src={portrait}
            alt={character.character_name}
            title={character.character_name}
            loading="eager"
            className="h-full w-full object-cover"
          />
        </motion.div>

        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="relative mb-8 font-body text-xs uppercase tracking-[0.5em] text-casted-muted"
        >
          Tonight, you are
        </motion.p>

        <motion.h1
          initial={{ scale: 1.3, opacity: 0, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.5 }}
          className="relative font-display text-5xl italic leading-[0.95] text-casted-cream sm:text-7xl md:text-8xl lg:text-[8.5rem]"
        >
          {character.character_name.toUpperCase()}
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 2.0, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-10 h-px w-24 origin-center bg-casted-gold"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.65 }}
          className="relative mt-8 font-display text-sm italic text-casted-gold sm:text-base"
        >
          {character.film_of_origin} <span className="text-casted-muted">·</span> {character.year}
        </motion.p>

        {character.vibe_tags?.length > 0 && (
          <div className="relative mt-10 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.25em] text-[#B8952A]">
            {character.vibe_tags.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95 + i * 0.18, duration: 0.5, ease: 'easeOut' }}
                className="flex items-center gap-3"
              >
                {tag}
                {i < character.vibe_tags.length - 1 && (
                  <span className="text-[rgba(184,149,42,0.35)]">·</span>
                )}
              </motion.span>
            ))}
          </div>
        )}

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.9,
            ease: 'easeOut',
            delay: 0.95 + Math.max(character.vibe_tags?.length ?? 0, 1) * 0.18 + 0.35,
          }}
          className="relative mb-6 mt-8 max-w-2xl font-body text-base leading-relaxed text-casted-cream/85 sm:text-lg"
        >
          {character.description}
        </motion.p>

        {character.match_line && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
              delay: 0.95 + Math.max(character.vibe_tags?.length ?? 0, 1) * 0.18 + 0.5,
            }}
            className="relative max-w-xl font-body text-xs uppercase tracking-[0.25em] text-casted-gold/80"
          >
            <span className="text-casted-gold">The Match</span>
            <span className="mx-2 text-casted-muted">·</span>
            <span className="normal-case tracking-normal text-casted-cream/70">
              {character.match_line}
            </span>
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
            delay: 0.95 + Math.max(character.vibe_tags?.length ?? 0, 1) * 0.18 + 0.6,
          }}
          className="relative mt-10 flex flex-col items-center gap-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <PillButton variant="outline-gold" onClick={() => setShareOpen(true)}>
              <Share2 size={12} />
              <span>Share</span>
            </PillButton>

            <PillButton variant="outline-muted" onClick={onRestart}>
              <RotateCcw size={12} />
              <span>Cast Me Again</span>
            </PillButton>
          </div>

          <PillButton
            variant="gold-fill"
            onClick={() =>
              document
                .getElementById('reel-section')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            <span>Your Cinema Tonight</span>
            <ChevronDown size={12} />
          </PillButton>
        </motion.div>
      </section>

      <section id="reel-section" className="relative px-6 pb-32" style={{ zIndex: 10 }}>
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.4, duration: 0.9 }}
            className="mb-12 flex items-end justify-between gap-6 border-b border-casted-charcoal pb-6"
          >
            <div>
              <p className="font-body text-[10px] uppercase tracking-[0.4em] text-casted-gold/70">
                The Reel
              </p>
              <h2 className="mt-2 font-display text-2xl italic text-casted-cream sm:text-3xl">
                Six films from {character.character_name.split(' ')[0]}'s world
              </h2>
            </div>
          </motion.div>

          {moviesLoading ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] animate-pulse bg-casted-charcoal/60"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {movies.map((movie, i) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3.6 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                >
                  <MovieCard
                    movie={movie}
                    vibeTags={i === 0 ? character.vibe_tags : undefined}
                    index={0}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {shareOpen && (
          <ShareCardModal
            character={character}
            backdrop={backdrop}
            onClose={() => setShareOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

type PillVariant = 'outline-gold' | 'outline-muted' | 'gold-fill'

function PillButton({
  variant,
  onClick,
  children,
}: {
  variant: PillVariant
  onClick: () => void
  children: ReactNode
}) {
  const [hover, setHover] = useState(false)

  const palette: Record<
    PillVariant,
    { rest: CSSProperties; hover: CSSProperties; pad: string; dur: string }
  > = {
    'outline-gold': {
      rest: {
        background: 'transparent',
        border: '1px solid rgba(184,149,42,0.4)',
        color: '#F2ECD8',
      },
      hover: {
        background: 'rgba(184,149,42,0.12)',
        border: '1px solid #B8952A',
        color: '#F2ECD8',
      },
      pad: 'px-6 py-2',
      dur: '0.3s',
    },
    'outline-muted': {
      rest: {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#6B6B7A',
      },
      hover: {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#F2ECD8',
      },
      pad: 'px-6 py-2',
      dur: '0.3s',
    },
    'gold-fill': {
      rest: { background: '#B8952A', border: '1px solid #B8952A', color: '#0A0A0B' },
      hover: { background: '#D4A843', border: '1px solid #D4A843', color: '#0A0A0B' },
      pad: 'px-8 py-2',
      dur: '0.25s',
    },
  }

  const cfg = palette[variant]
  const state = hover ? cfg.hover : cfg.rest

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`inline-flex items-center gap-[6px] rounded-full font-body text-xs uppercase tracking-widest ${cfg.pad}`}
      style={{
        ...state,
        transition: `all ${cfg.dur} ease`,
        transform: variant === 'gold-fill' && hover ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {children}
    </button>
  )
}

