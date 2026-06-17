import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fetchTrending, posterUrl, getYear } from '../../lib/tmdb'
import PosterImage from '../shared/PosterImage'
import type { TMDBMovie } from '../../types'

export default function TrendingRow() {
  const [movies, setMovies] = useState<TMDBMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchTrending()
      .then((list) => {
        if (cancelled) return
        setMovies(list.slice(0, 6))
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Trending unavailable')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="relative px-6 pb-32 pt-12">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9 }}
          className="relative mb-10 flex items-end justify-center border-b border-casted-charcoal pb-6"
        >
          <h2 className="font-body text-xs uppercase tracking-[0.55em] text-casted-gold/90 sm:text-sm">
            Now Playing In The World
          </h2>
          <p className="absolute bottom-6 right-0 hidden font-body text-[10px] uppercase tracking-[0.3em] text-casted-muted sm:block">
            via TMDB
          </p>
        </motion.div>

        {error ? (
          <p className="font-body text-sm text-casted-muted">{error}</p>
        ) : loading ? (
          <div className="flex w-full justify-center">
            <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] animate-pulse bg-casted-charcoal/60"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex w-full justify-center">
            <div className="grid w-full grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {movies.map((movie, i) => {
              const poster = posterUrl(movie.poster_path)
              const year = getYear(movie.release_date)
              return (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.9, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative aspect-[2/3] overflow-hidden border border-casted-charcoal transition-all duration-500 hover:border-casted-gold hover:shadow-[0_0_50px_-10px_rgba(184,149,42,0.7)]"
                >
                  <PosterImage
                    src={poster}
                    alt={movie.title}
                    title={movie.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                  />

                  {year && (
                    <span className="absolute right-2 top-2 border border-casted-gold/70 bg-casted-black/70 px-2 py-0.5 font-body text-[10px] uppercase tracking-[0.2em] text-casted-gold backdrop-blur-sm">
                      {year}
                    </span>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-casted-black via-casted-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <h3 className="font-display text-base italic leading-tight text-casted-cream">
                      {movie.title}
                    </h3>
                  </div>
                </motion.div>
              )
            })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
