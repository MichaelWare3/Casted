import { useEffect, useMemo, useState } from 'react'
import { useTheater } from './useTheater'
import { fetchTrending, getYear } from '../lib/tmdb'
import {
  buildTasteFromTheater,
  hasTasteHistory,
  type TasteProfile,
} from '../lib/taste'

/**
 * Returns the viewer's taste profile. When there's no real history yet, it
 * seeds `loved` from TMDB trending so personalization still produces sensible
 * picks (cold-start), marked with `coldStart: true`.
 */
export function useTaste(): TasteProfile {
  const { theater } = useTheater()
  const base = useMemo(() => buildTasteFromTheater(theater), [theater])
  const hasHistory = hasTasteHistory(base)

  const [trending, setTrending] = useState<string[]>([])

  useEffect(() => {
    if (hasHistory) return
    let cancelled = false
    fetchTrending()
      .then((list) => {
        if (cancelled) return
        const titles = list
          .slice(0, 8)
          .map((m) => {
            const y = getYear(m.release_date)
            return y ? `${m.title} (${y})` : m.title
          })
        setTrending(titles)
      })
      .catch(() => {
        /* trending unavailable — leave profile empty, falls back to generic */
      })
    return () => {
      cancelled = true
    }
  }, [hasHistory])

  return useMemo<TasteProfile>(() => {
    if (hasHistory) return base
    if (trending.length === 0) return base // still empty → generic fallback
    return { loved: trending, disliked: [], alsoWatched: [], coldStart: true }
  }, [base, hasHistory, trending])
}
