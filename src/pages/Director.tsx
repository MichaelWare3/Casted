import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus, X } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import ErrorState from '../components/shared/ErrorState'
import LoadingDots from '../components/shared/LoadingDots'
import PosterImage from '../components/shared/PosterImage'
import WhereToWatch from '../components/shared/WhereToWatch'
import GenreSelect from '../components/director/GenreSelect'
import WatchingWithSelect from '../components/director/WatchingWithSelect'
import { useDocTitle } from '../hooks/useDocTitle'
import { fetchDirectorPick } from '../lib/claude'
import { fetchMovieTrailer, posterUrl, searchMovie } from '../lib/tmdb'
import { useTheater } from '../hooks/useTheater'
import { useTaste } from '../hooks/useTaste'
import { tasteToPromptBlock } from '../lib/taste'
import type { DirectorAnswer, DirectorPick, TMDBMovie, TMDBVideo } from '../types'

type Question = {
  id: number
  text: string
  chips: string[] | null
  allowFree: boolean
  cards?: boolean
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'Who are you watching with tonight?',
    chips: null,
    allowFree: false,
    cards: true,
  },
  {
    id: 2,
    text: 'Last film you loved — what was it?',
    chips: null,
    allowFree: true,
  },
  {
    id: 3,
    text: 'What do you NOT want to feel tonight?',
    chips: ['Sad', 'Stressed', 'Bored', 'Scared'],
    allowFree: false,
  },
  {
    id: 4,
    text: 'How much time do you have?',
    chips: ['Under 90 min', '2 hours', 'All night'],
    allowFree: false,
  },
]

const LOADING_LINES = [
  'Consulting the archives…',
  'Cross-referencing 10,000 films…',
  'Your film is ready.',
]

type Phase = 'genre' | 'asking' | 'loading' | 'reveal' | 'error'

export default function Director() {
  useDocTitle('CASTED — The Director')
  const [phase, setPhase] = useState<Phase>('genre')
  const [genre, setGenre] = useState<string | null>(null)
  const [exchanges, setExchanges] = useState<DirectorAnswer[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [textInput, setTextInput] = useState('')
  const [pick, setPick] = useState<DirectorPick | null>(null)
  const [movie, setMovie] = useState<TMDBMovie | null>(null)
  const [trailer, setTrailer] = useState<TMDBVideo | null>(null)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [loadingLineIdx, setLoadingLineIdx] = useState(0)
  const [errMsg, setErrMsg] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const taste = useTaste()

  const currentQ = QUESTIONS[currentIdx]
  const done = currentIdx >= QUESTIONS.length

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [exchanges, currentIdx, phase])

  useEffect(() => {
    if (phase !== 'loading') return
    setLoadingLineIdx(0)
    const t1 = setTimeout(() => setLoadingLineIdx(1), 1200)
    const t2 = setTimeout(() => setLoadingLineIdx(2), 2400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [phase])

  async function submitAnswer(answer: string) {
    const trimmed = answer.trim()
    if (!trimmed) return
    const next = [...exchanges, { question: currentQ.text, answer: trimmed }]
    setExchanges(next)
    setTextInput('')
    const nextIdx = currentIdx + 1
    setCurrentIdx(nextIdx)
    if (nextIdx >= QUESTIONS.length) {
      runDirector(next)
    }
  }

  async function runDirector(answers: DirectorAnswer[]) {
    setPhase('loading')
    try {
      const minLoading = new Promise((r) => setTimeout(r, 3200))
      const result = await fetchDirectorPick(answers, genre ?? undefined, tasteToPromptBlock(taste))
      const movieHit = await searchMovie(result.tmdb_search || result.title)
      let trailerHit: TMDBVideo | null = null
      if (movieHit) {
        trailerHit = await fetchMovieTrailer(movieHit.id).catch(() => null)
      }
      await minLoading
      setPick(result)
      setMovie(movieHit)
      setTrailer(trailerHit)
      setPhase('reveal')
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'The Director went silent.')
      setPhase('error')
    }
  }

  function reset() {
    setPhase('genre')
    setGenre(null)
    setExchanges([])
    setCurrentIdx(0)
    setTextInput('')
    setPick(null)
    setMovie(null)
    setTrailer(null)
    setErrMsg('')
  }

  function handleGenrePick(name: string) {
    setGenre(name)
    setPhase('asking')
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
            className="font-display text-6xl italic tracking-tight text-casted-cream"
          >
            The Director
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="font-display text-xl italic text-[#B8952A]"
            style={{ marginTop: '12px' }}
          >
            Tell me about tonight.
          </motion.p>
        </div>

        <div
          className="relative flex w-full justify-center"
          style={{ marginTop: '48px' }}
        >
          <AnimatePresence mode="wait">
            {phase === 'genre' ? (
              <motion.div
                key="genre"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="w-[90%]"
                style={{ maxWidth: '880px' }}
              >
                <GenreSelect onSelect={handleGenrePick} />
              </motion.div>
            ) : phase === 'reveal' && pick ? (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="w-[90%]"
                style={{ maxWidth: '720px' }}
              >
                <FilmReveal
                  pick={pick}
                  movie={movie}
                  trailer={trailer}
                  onTrailer={() => setTrailerOpen(true)}
                  onAgain={reset}
                />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="relative w-[90%]"
                style={{
                  maxWidth: '640px',
                  background: 'rgba(17,17,20,0.8)',
                  border: '1px solid rgba(184,149,42,0.15)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: '2px',
                  padding: 'clamp(24px, 5vw, 48px)',
                }}
              >
                {phase !== 'error' && (
                  <ChatThread
                    exchanges={exchanges}
                    currentQ={done ? null : currentQ}
                    onChip={submitAnswer}
                    textInput={textInput}
                    setTextInput={setTextInput}
                    onSubmitText={() => submitAnswer(textInput)}
                    disabled={phase === 'loading'}
                  />
                )}

                <AnimatePresence>
                  {phase === 'loading' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 z-20 flex items-center justify-center"
                      style={{ background: 'rgba(10,10,11,0.97)' }}
                    >
                      <div className="flex flex-col items-center gap-6 px-6 text-center">
                        <LoadingDots />
                        {LOADING_LINES.map((line, i) => (
                          <motion.p
                            key={line}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: i <= loadingLineIdx ? 1 : 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="font-display text-xl italic text-casted-cream"
                          >
                            {line}
                          </motion.p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {phase === 'error' && (
                  <ErrorState
                    message={errMsg || 'Something went wrong. Try again.'}
                    onRetry={reset}
                  />
                )}

                <div ref={scrollRef} />
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

interface ChatThreadProps {
  exchanges: DirectorAnswer[]
  currentQ: Question | null
  onChip: (value: string) => void
  textInput: string
  setTextInput: (v: string) => void
  onSubmitText: () => void
  disabled: boolean
}

function ChatThread({
  exchanges,
  currentQ,
  onChip,
  textInput,
  setTextInput,
  onSubmitText,
  disabled,
}: ChatThreadProps) {
  return (
    <div className="flex flex-col">
      {exchanges.map((ex, i) => (
        <div key={i} className="flex flex-col">
          <p className="text-center font-display text-2xl italic text-casted-cream">
            {ex.question}
          </p>
          <p
            className="self-end text-right font-body text-sm italic"
            style={{ color: '#A89F8C', marginTop: '24px' }}
          >
            {ex.answer}
          </p>
          <div
            style={{
              height: '1px',
              width: '100%',
              background: 'rgba(184,149,42,0.12)',
              margin: '24px 0',
            }}
          />
        </div>
      ))}

      {currentQ && (
        <motion.div
          key={`q-${currentQ.id}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <p
            className="w-full text-center font-display text-2xl italic text-casted-cream"
            style={{ marginBottom: '32px' }}
          >
            {currentQ.text}
          </p>

          {currentQ.cards && (
            <WatchingWithSelect onSelect={onChip} disabled={disabled} />
          )}

          {currentQ.chips && (
            <div
              className="flex w-full flex-wrap items-center justify-center"
              style={{ gap: '12px' }}
            >
              {currentQ.chips.map((chip) => (
                <button
                  key={chip}
                  disabled={disabled}
                  onClick={() => onChip(chip)}
                  className="director-chip font-body text-sm uppercase tracking-widest text-casted-cream disabled:opacity-40"
                  style={{
                    padding: '8px 24px',
                    border: '1px solid rgba(184,149,42,0.4)',
                    background: 'transparent',
                    borderRadius: 0,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {currentQ.allowFree && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSubmitText()
              }}
              className="flex w-full flex-col items-center"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Name a film..."
                disabled={disabled}
                autoFocus
                className="w-full bg-transparent text-center font-display text-xl italic text-casted-cream focus:outline-none"
                style={{
                  borderBottom: '1px solid rgba(184,149,42,0.4)',
                  padding: '8px 4px',
                }}
              />
              <p
                className="font-body text-xs uppercase tracking-widest"
                style={{ color: '#4A4A55', marginTop: '12px' }}
              >
                press enter to continue
              </p>
            </form>
          )}
        </motion.div>
      )}
    </div>
  )
}

interface FilmRevealProps {
  pick: DirectorPick
  movie: TMDBMovie | null
  trailer: TMDBVideo | null
  onTrailer: () => void
  onAgain: () => void
}

function FilmReveal({ pick, movie, trailer, onTrailer, onAgain }: FilmRevealProps) {
  const { add, has } = useTheater()
  const inTheater = movie ? has(movie.id) : false
  const poster = movie ? posterUrl(movie.poster_path, 'large') : null
  const runtime = useMemo(() => {
    if (!pick.runtime_minutes) return ''
    return `${pick.runtime_minutes} min`
  }, [pick.runtime_minutes])

  const metaLine = [
    pick.director_name ? `Directed by ${pick.director_name}` : null,
    pick.year || null,
    runtime || null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-start">
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{
          width: '220px',
          height: '330px',
          border: '1px solid rgba(184,149,42,0.2)',
        }}
      >
        <PosterImage
          src={poster}
          alt={pick.title}
          title={pick.title}
          loading="eager"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col text-left max-sm:mt-6 max-sm:pl-0 max-sm:text-center sm:pl-8">
        <h2 className="font-display text-4xl italic leading-tight text-casted-cream">
          {pick.title}
        </h2>
        <p className="mt-2 font-body text-sm" style={{ color: '#6B6B7A' }}>
          {metaLine}
        </p>

        {pick.vibe_tags?.length > 0 && (
          <div
            className="flex flex-wrap max-sm:justify-center"
            style={{ marginTop: '16px', gap: '8px' }}
          >
            {pick.vibe_tags.slice(0, 3).map((tag) => (
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
        )}

        <p
          className="font-display text-base italic"
          style={{
            color: '#A89F8C',
            lineHeight: 1.8,
            marginTop: '20px',
          }}
        >
          {pick.personal_reason}
        </p>

        <div
          className="flex flex-wrap items-center max-sm:justify-center"
          style={{ marginTop: '28px', gap: '12px' }}
        >
          <button
            disabled={!trailer}
            onClick={onTrailer}
            className="font-body text-xs uppercase tracking-widest text-casted-black transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              padding: '8px 24px',
              background: '#B8952A',
              border: '1px solid #B8952A',
            }}
            onMouseEnter={(e) => {
              if (!trailer) return
              ;(e.currentTarget as HTMLButtonElement).style.background = '#D4A843'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#D4A843'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = '#B8952A'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#B8952A'
            }}
          >
            {trailer ? 'Watch Trailer' : 'No Trailer'}
          </button>
          <button
            disabled={!movie || inTheater}
            onClick={() => movie && add(movie)}
            className="inline-flex items-center font-body text-xs uppercase tracking-widest text-[#B8952A] transition-colors disabled:opacity-50"
            style={{
              padding: '8px 24px',
              background: 'transparent',
              border: '1px solid #B8952A',
              gap: '6px',
            }}
          >
            {inTheater ? <Check size={12} /> : <Plus size={12} />}
            {inTheater ? 'In Theater' : 'Add to Theater'}
          </button>
          <button
            onClick={onAgain}
            className="font-body text-xs uppercase tracking-widest transition-colors hover:text-casted-cream"
            style={{ color: '#4A4A55' }}
          >
            Ask Again
          </button>
        </div>

        {movie && (
          <div className="max-sm:flex max-sm:justify-center" style={{ marginTop: '32px' }}>
            <WhereToWatch movieId={movie.id} />
          </div>
        )}
      </div>
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
