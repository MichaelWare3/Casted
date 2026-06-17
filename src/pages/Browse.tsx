import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import FilterBar from '../components/browse/FilterBar'
import PosterCard from '../components/browse/PosterCard'
import DetailModal from '../components/browse/DetailModal'
import BlindCastModal from '../components/browse/BlindCastModal'
import PremiumPickHero from '../components/browse/PremiumPickHero'
import ErrorState from '../components/shared/ErrorState'
import LoadingDots from '../components/shared/LoadingDots'
import { useDocTitle } from '../hooks/useDocTitle'
import { discoverMovies, type BrowseFilters } from '../lib/tmdb'
import type { TMDBMovie } from '../types'

const EMPTY_FILTERS: BrowseFilters = {
  genre: null,
  era: null,
  country: null,
  runtime: null,
  minRating: null,
}

const POPULAR_RATIO = 12 // out of every 20
const PAGE_SIZE = 20

function dedupe(list: TMDBMovie[]): TMDBMovie[] {
  const seen = new Set<number>()
  const out: TMDBMovie[] = []
  for (const m of list) {
    if (seen.has(m.id) || !m.poster_path) continue
    seen.add(m.id)
    out.push(m)
  }
  return out
}

function interleave(popular: TMDBMovie[], gems: TMDBMovie[]): TMDBMovie[] {
  const pop = popular.slice(0, POPULAR_RATIO)
  const gem = gems.slice(0, PAGE_SIZE - POPULAR_RATIO)
  const out: TMDBMovie[] = []
  const max = Math.max(pop.length, gem.length)
  for (let i = 0; i < max; i++) {
    if (pop[i]) out.push(pop[i])
    if (gem[i]) out.push(gem[i])
  }
  return out
}

export default function Browse() {
  useDocTitle('CASTED — Browse')
  const [filters, setFilters] = useState<BrowseFilters>(EMPTY_FILTERS)
  const [hiddenGems, setHiddenGems] = useState(false)
  const [movies, setMovies] = useState<TMDBMovie[]>([])
  const [popPage, setPopPage] = useState(1)
  const [gemPage, setGemPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [err, setErr] = useState('')
  const [detail, setDetail] = useState<TMDBMovie | null>(null)
  const [blind, setBlind] = useState<TMDBMovie | null>(null)
  const requestId = useRef(0)

  const loadBatch = useCallback(
    async (mode: 'reset' | 'append') => {
      const myReq = ++requestId.current
      setLoading(true)
      setErr('')

      const popPg = mode === 'reset' ? 1 : popPage + 1
      const gemPg = mode === 'reset' ? 1 : gemPage + 1

      try {
        let batch: TMDBMovie[]
        if (hiddenGems) {
          const gems = await discoverMovies({ ...filters, hiddenGems: true, page: gemPg })
          batch = dedupe(gems).slice(0, PAGE_SIZE)
          if (myReq !== requestId.current) return
          setGemPage(gemPg)
        } else {
          const [pop, gems] = await Promise.all([
            discoverMovies({ ...filters, hiddenGems: false, page: popPg }),
            discoverMovies({ ...filters, hiddenGems: true, page: gemPg }),
          ])
          batch = dedupe(interleave(pop, gems))
          if (myReq !== requestId.current) return
          setPopPage(popPg)
          setGemPage(gemPg)
        }

        setMovies((prev) => (mode === 'reset' ? batch : dedupe([...prev, ...batch])))
      } catch (e) {
        if (myReq !== requestId.current) return
        setErr(e instanceof Error ? e.message : 'Could not load films.')
      } finally {
        if (myReq === requestId.current) {
          setLoading(false)
          setInitialLoad(false)
        }
      }
    },
    [filters, hiddenGems, popPage, gemPage],
  )

  useEffect(() => {
    setMovies([])
    setPopPage(1)
    setGemPage(1)
    setInitialLoad(true)
    loadBatch('reset')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, hiddenGems])

  const filteredForBlind = useMemo(() => movies, [movies])

  function castBlind() {
    if (filteredForBlind.length === 0) return
    const pick = filteredForBlind[Math.floor(Math.random() * filteredForBlind.length)]
    setBlind(pick)
  }

  function reset() {
    setFilters(EMPTY_FILTERS)
    setHiddenGems(false)
  }

  return (
    <div className="relative min-h-screen bg-casted-black">
      <Navbar />

      <main className="relative w-full pb-32" style={{ paddingTop: 0 }}>
        <PremiumPickHero onOpen={setDetail} />

        <div className="mx-auto w-full max-w-7xl px-6" style={{ marginTop: '64px' }}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="font-display text-5xl italic tracking-tight text-casted-cream sm:text-6xl"
              >
                Browse
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
                className="mt-2 font-display text-base italic text-casted-gold/80"
              >
                Wander the archive. Find something new.
              </motion.p>
            </div>

            <motion.button
              type="button"
              onClick={castBlind}
              disabled={filteredForBlind.length === 0}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-widest text-casted-black disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                padding: '10px 24px',
                background: '#B8952A',
                border: '1px solid #B8952A',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                if (filteredForBlind.length === 0) return
                ;(e.currentTarget as HTMLButtonElement).style.background = '#D4A843'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#D4A843'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = '#B8952A'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#B8952A'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
              }}
            >
              <Shuffle size={13} strokeWidth={2} />
              Blind Cast
            </motion.button>
          </div>

          <div className="mt-8">
            <FilterBar
              filters={filters}
              hiddenGems={hiddenGems}
              onChange={setFilters}
              onToggleHiddenGems={() => setHiddenGems((v) => !v)}
              onReset={reset}
            />
          </div>

          <div
            className="mt-10 grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '14px',
            }}
          >
            {movies.map((m, i) => (
              <PosterCard key={m.id} movie={m} index={i} onOpen={setDetail} />
            ))}
          </div>

          {initialLoad && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <LoadingDots />
              <p className="font-display text-sm italic text-casted-cream/60">
                Loading the archive…
              </p>
            </div>
          )}

          {err && (
            <div className="mt-12">
              <ErrorState message={err} onRetry={() => loadBatch('reset')} />
            </div>
          )}

          {!initialLoad && !err && movies.length === 0 && (
            <div className="mt-16 text-center">
              <p className="font-display text-xl italic text-casted-cream/70">
                Nothing matches that combination.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-4 font-body text-xs uppercase tracking-widest text-casted-gold transition-colors hover:text-casted-cream"
              >
                Reset filters
              </button>
            </div>
          )}

          {!initialLoad && !err && movies.length > 0 && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => loadBatch('append')}
                className="font-body text-xs uppercase tracking-widest text-casted-gold disabled:opacity-40"
                style={{
                  padding: '10px 28px',
                  background: 'transparent',
                  border: '1px solid #B8952A',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {detail && (
          <DetailModal
            key={`detail-${detail.id}`}
            movie={detail}
            onClose={() => setDetail(null)}
            onOpen={(m) => setDetail(m)}
          />
        )}
        {blind && (
          <BlindCastModal
            key={`blind-${blind.id}`}
            movie={blind}
            onClose={() => setBlind(null)}
            onReveal={(m) => {
              setBlind(null)
              setDetail(m)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
