import { useCallback, useEffect, useState } from 'react'
import type { TheaterMovie, TMDBMovie } from '../types'
import { getYear } from '../lib/tmdb'

const STORAGE_KEY = 'casted_theater_v1'

function read(): TheaterMovie[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TheaterMovie[]) : []
  } catch {
    return []
  }
}

/**
 * Module-level store shared by every useTheater() instance in this tab.
 * The browser `storage` event only fires in OTHER tabs, so without this an
 * add() in one component (e.g. a poster card) would never update the Navbar
 * badge or other cards in the same tab. Listeners give us live, in-tab sync.
 */
let store: TheaterMovie[] = read()
const listeners = new Set<(value: TheaterMovie[]) => void>()

function emit() {
  for (const listener of listeners) listener(store)
}

function persist(items: TheaterMovie[]) {
  store = items
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage full or unavailable — keep the in-memory copy so the UI
    // still works for the rest of the session.
  }
  emit()
}

export function useTheater() {
  const [theater, setTheater] = useState<TheaterMovie[]>(store)

  useEffect(() => {
    const onChange = (value: TheaterMovie[]) => setTheater(value)
    listeners.add(onChange)
    // Re-sync in case the store changed between initial render and effect.
    setTheater(store)

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        store = read()
        emit()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const add = useCallback((movie: TMDBMovie) => {
    if (store.some((m) => m.id === movie.id)) return
    persist([
      ...store,
      {
        id: movie.id,
        title: movie.title,
        year: getYear(movie.release_date),
        poster_path: movie.poster_path,
        added_at: Date.now(),
      },
    ])
  }, [])

  const remove = useCallback((id: number) => {
    persist(store.filter((m) => m.id !== id))
  }, [])

  const toggleWatched = useCallback((id: number) => {
    persist(
      store.map((m) =>
        m.id === id
          ? {
              ...m,
              watched: !m.watched,
              watched_at: !m.watched ? (m.watched_at ?? Date.now()) : m.watched_at,
            }
          : m,
      ),
    )
  }, [])

  const rate = useCallback((id: number, rating: number) => {
    persist(
      store.map((m) =>
        m.id === id
          ? {
              // Clicking the current rating again clears it.
              ...m,
              rating: m.rating === rating ? undefined : rating,
              watched: true,
              watched_at: m.watched_at ?? Date.now(),
            }
          : m,
      ),
    )
  }, [])

  const has = useCallback((id: number) => theater.some((m) => m.id === id), [theater])

  return { theater, add, remove, has, toggleWatched, rate }
}
