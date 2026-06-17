import { useState, type CSSProperties } from 'react'
import PosterFallback from './PosterFallback'

interface PosterImageProps {
  src: string | null | undefined
  alt: string
  /** Shown inside the fallback when there's no src or the image fails to load. */
  title: string
  className?: string
  style?: CSSProperties
  loading?: 'lazy' | 'eager'
}

/**
 * Renders a poster image with a graceful fallback. If `src` is missing OR the
 * image 404s / fails to load at runtime, it swaps to the branded PosterFallback
 * instead of showing a broken-image icon.
 */
export default function PosterImage({
  src,
  alt,
  title,
  className,
  style,
  loading = 'lazy',
}: PosterImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return <PosterFallback title={title} />
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}
