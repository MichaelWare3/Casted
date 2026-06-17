import { useEffect, useState } from 'react'
import {
  fetchWatchProviders,
  providerLogoUrl,
  type WatchProvider,
  type WatchProviders,
} from '../../lib/tmdb'

interface WhereToWatchProps {
  movieId: number
  align?: 'left' | 'center'
}

/**
 * "Where to watch" strip — streaming / rent / buy availability for a film.
 * Data comes from TMDB's /watch/providers endpoint (powered by JustWatch),
 * which requires visible JustWatch attribution.
 */
export default function WhereToWatch({ movieId, align = 'left' }: WhereToWatchProps) {
  const [data, setData] = useState<WatchProviders | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setLoaded(false)
    fetchWatchProviders(movieId)
      .then((res) => {
        if (cancelled) return
        setData(res)
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [movieId])

  if (!loaded || !data) return null

  const sections: { label: string; items: WatchProvider[] }[] = [
    { label: 'Stream', items: data.flatrate },
    { label: 'Rent', items: data.rent },
    { label: 'Buy', items: data.buy },
  ].filter((s) => s.items.length > 0)

  if (sections.length === 0) return null

  const isCenter = align === 'center'
  const alignClass = isCenter ? 'items-center text-center' : 'items-start text-left'
  const rowJustify = isCenter ? 'justify-center' : 'justify-start'

  return (
    <div className={`flex flex-col ${alignClass}`} style={{ gap: '16px' }}>
      <span
        className="font-body text-[10px] uppercase tracking-[0.35em]"
        style={{ color: '#B8952A' }}
      >
        Where to Watch
      </span>

      <div className={`flex flex-col ${alignClass}`} style={{ gap: '12px' }}>
        {sections.map((section) => (
          <div
            key={section.label}
            className={`flex flex-wrap items-center ${rowJustify}`}
            style={{ gap: '8px' }}
          >
            <span
              className="font-body text-[9px] uppercase tracking-[0.25em]"
              style={{ color: '#6B6B7A', minWidth: '44px' }}
            >
              {section.label}
            </span>
            {section.items.map((p) => (
              <ProviderLogo key={p.provider_id} provider={p} link={data.link} />
            ))}
          </div>
        ))}
      </div>

      <div className={`flex flex-col ${alignClass}`} style={{ gap: '4px' }}>
        {data.link && (
          <a
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[10px] uppercase tracking-widest transition-colors"
            style={{ color: '#6B6B7A' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.color = '#B8952A'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.color = '#6B6B7A'
            }}
          >
            More options on JustWatch →
          </a>
        )}
        <span className="font-body text-[9px]" style={{ color: '#4A4A55' }}>
          Streaming data by JustWatch
        </span>
      </div>
    </div>
  )
}

function ProviderLogo({ provider, link }: { provider: WatchProvider; link: string | null }) {
  const logo = providerLogoUrl(provider.logo_path)

  const inner = logo ? (
    <img
      src={logo}
      alt={provider.provider_name}
      title={provider.provider_name}
      loading="lazy"
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
      }}
      style={{
        width: '38px',
        height: '38px',
        borderRadius: '8px',
        objectFit: 'cover',
        display: 'block',
        border: '1px solid rgba(184,149,42,0.2)',
      }}
    />
  ) : (
    <span
      className="font-body text-[10px]"
      title={provider.provider_name}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '38px',
        padding: '0 10px',
        borderRadius: '8px',
        border: '1px solid rgba(184,149,42,0.2)',
        color: '#F2ECD8',
      }}
    >
      {provider.provider_name}
    </span>
  )

  if (!link) {
    return <span style={{ display: 'block' }}>{inner}</span>
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      title={`Watch ${provider.provider_name} options on JustWatch`}
      className="transition-transform"
      style={{ display: 'block' }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.08)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'
      }}
    >
      {inner}
    </a>
  )
}
