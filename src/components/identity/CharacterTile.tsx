import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PosterImage from '../shared/PosterImage'
import { posterUrl, searchMovie } from '../../lib/tmdb'
import type { PoolCharacter } from '../../lib/characters'

interface CharacterTileProps {
  character: PoolCharacter
  index: number
}

export default function CharacterTile({ character, index }: CharacterTileProps) {
  const [poster, setPoster] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    searchMovie(character.film)
      .then((m) => {
        if (!cancelled) setPoster(posterUrl(m?.poster_path ?? null, 'medium'))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [character.film])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5), ease: 'easeOut' }}
      className="group relative flex flex-col"
    >
      <div
        className="relative overflow-hidden border border-casted-gold/20 transition-all duration-300 group-hover:border-casted-gold/60"
        style={{ aspectRatio: '2 / 3' }}
      >
        <PosterImage
          src={poster}
          alt={character.name}
          title={character.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-casted-black via-casted-black/20 to-transparent opacity-90" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="font-display text-base italic leading-tight text-casted-cream">
            {character.name}
          </p>
          <p className="mt-0.5 font-body text-[10px] uppercase tracking-[0.2em] text-casted-gold/80">
            {character.film} · {character.year}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
