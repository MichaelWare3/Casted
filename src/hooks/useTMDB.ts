import { useCallback, useState } from 'react'
import { searchMovies } from '../lib/tmdb'
import type { TMDBMovie } from '../types'

interface UseTMDBState {
  movies: TMDBMovie[]
  loading: boolean
  error: string | null
}

export function useTMDB() {
  const [state, setState] = useState<UseTMDBState>({
    movies: [],
    loading: false,
    error: null,
  })

  const fetchMoviesByQueries = useCallback(async (queries: string[]) => {
    setState({ movies: [], loading: true, error: null })
    try {
      const movies = await searchMovies(queries)
      setState({ movies, loading: false, error: null })
      return movies
    } catch (err) {
      const message = err instanceof Error ? err.message : 'The reel snapped.'
      setState({ movies: [], loading: false, error: message })
      throw err
    }
  }, [])

  return { ...state, fetchMoviesByQueries }
}
