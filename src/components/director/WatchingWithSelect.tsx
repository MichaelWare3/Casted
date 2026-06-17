import { useEffect, useState } from 'react'
import { fetchGenreBackground } from '../../lib/unsplash'
import ImageCard from './ImageCard'

interface CompanyOption {
  label: string
  query: string
}

const OPTIONS: CompanyOption[] = [
  { label: 'Just Me', query: 'person alone cinema dark' },
  { label: 'Date Night', query: 'couple romantic dinner candle' },
  { label: 'Friends', query: 'friends laughing night out' },
  { label: 'Family', query: 'family cozy living room warm' },
]

interface WatchingWithSelectProps {
  onSelect: (label: string) => void
  disabled?: boolean
}

export default function WatchingWithSelect({ onSelect, disabled }: WatchingWithSelectProps) {
  const [backgrounds, setBackgrounds] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    OPTIONS.forEach((o) => {
      fetchGenreBackground(o.query)
        .then((url) => {
          if (cancelled) return
          setBackgrounds((prev) => ({ ...prev, [o.label]: url }))
        })
        .catch((err) => {
          console.warn(`[CASTED] Unsplash failed for ${o.label}`, err)
        })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      className="grid w-full"
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
      }}
    >
      {OPTIONS.map((o, i) => (
        <ImageCard
          key={o.label}
          label={o.label}
          background={backgrounds[o.label] ?? null}
          delay={i * 0.06}
          onClick={() => {
            if (disabled) return
            onSelect(o.label)
          }}
        />
      ))}
    </div>
  )
}
