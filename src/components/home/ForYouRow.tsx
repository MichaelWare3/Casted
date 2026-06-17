import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import MovieCard from '../shared/MovieCard'
import { useTaste } from '../../hooks/useTaste'
import { tasteToPromptBlock } from '../../lib/taste'
import { fetchForYouTitles } from '../../lib/claude'
import { searchMovies } from '../../lib/tmdb'
import type { TMDBMovie } from '../../types'

const CACHE_KEY = 'casted_foryou_v1'
const MAX_CARDS = 6
const MIN_CARDS = 3

interface CacheShape {
  date: string
  sig: string
  movies: TMDBMovie[]
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function signature(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return String(h)
}

function readCache(sig: string): TMDBMovie[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as CacheShape
    if (c.date === todayKey() && c.sig === sig && Array.isArray(c.movies)) return c.movies
  } catch {
    /* ignore */
  }
  return null
}

function writeCache(sig: string, movies: TMDBMovie[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ date: todayKey(), sig, movies } as CacheShape))
  } catch {
    /* ignore */
  }
}

type State = 'hidden' | 'loading' | 'ready'

export default function ForYouRow() {
  const taste = useTaste()
  const block = tasteToPromptBlock(taste)

  const [movies, setMovies] = useState<TMDBMovie[]>([])
  const [state, setState] = useState<State>('hidden')

  useEffect(() => {
    if (!block) {
      setState('hidden')
      return
    }
    const sig = signature(block)

    const cached = readCache(sig)
    if (cached) {
      setMovies(cached.slice(0, MAX_CARDS))
      setState(cached.length >= MIN_CARDS ? 'ready' : 'hidden')
      return
    }

    let cancelled = false
    setState('loading')
    fetchForYouTitles(block)
      .then((titles) => searchMovies(titles))
      .then((list) => {
        if (cancelled) return
        const seen = new Set<number>()
        const unique = list.filter((m) => {
          if (!m.poster_path || seen.has(m.id)) return false
          seen.add(m.id)
          return true
        })
        const top = unique.slice(0, MAX_CARDS)
        writeCache(sig, top)
        setMovies(top)
        setState(top.length >= MIN_CARDS ? 'ready' : 'hidden')
      })
      .catch(() => {
        if (!cancelled) setState('hidden')
      })

    return () => {
      cancelled = true
    }
  }, [block])

  if (state === 'hidden') return null

  return (
    <section className="relative px-6 pb-24 pt-4">
      <div className="mx-auto w-full max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="relative mb-10 flex items-end justify-center border-b border-casted-charcoal pb-6"
        >
          <h2 className="font-body text-xs uppercase tracking-[0.55em] text-casted-gold/90 sm:text-sm">
            Made For You
          </h2>
        </motion.div>

        {state === 'loading' ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: MAX_CARDS }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse bg-casted-charcoal/60" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {movies.map((movie, i) => (
              <MovieCard key={movie.id} movie={movie} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
