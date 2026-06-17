import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchGenreBackground } from '../../lib/unsplash'
import ImageCard from './ImageCard'

export interface Genre {
  name: string
  query: string
  image?: string
}

export const GENRES: Genre[] = [
  { name: 'Action', query: 'cinematic explosion dark' },
  { name: 'Comedy', query: 'cinematic theater stage spotlight' },
  { name: 'Love', query: 'cinematic romance', image: '/images/genres/love.jpg' },
  { name: 'Horror', query: 'dark eerie fog', image: '/images/genres/horror.jpg' },
  { name: 'Sci-Fi', query: 'futuristic neon space', image: '/images/genres/sci-fi.jpg' },
  { name: 'Fantasy', query: 'magical forest light', image: '/images/genres/fantasy.jpg' },
  { name: 'Mystery', query: 'noir dark city rain', image: '/images/genres/mystery.jpg' },
  { name: 'Drama', query: 'moody stage spotlight curtain dark' },
]

interface GenreSelectProps {
  onSelect: (genre: string) => void
}

export default function GenreSelect({ onSelect }: GenreSelectProps) {
  const [backgrounds, setBackgrounds] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    GENRES.forEach((g) => {
      if (g.image) {
        setBackgrounds((prev) => ({ ...prev, [g.name]: g.image! }))
        return
      }
      fetchGenreBackground(g.query)
        .then((url) => {
          if (cancelled) return
          setBackgrounds((prev) => ({ ...prev, [g.name]: url }))
        })
        .catch((err) => {
          console.warn(`[CASTED] Unsplash failed for ${g.name}`, err)
        })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="w-full">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center font-display text-2xl italic text-casted-cream"
        style={{ marginBottom: '32px' }}
      >
        Pick your mood.
      </motion.p>

      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
        }}
      >
        {GENRES.map((g, i) => (
          <ImageCard
            key={g.name}
            label={g.name}
            background={backgrounds[g.name] ?? null}
            delay={i * 0.06}
            onClick={() => onSelect(g.name)}
          />
        ))}
      </div>
    </div>
  )
}
