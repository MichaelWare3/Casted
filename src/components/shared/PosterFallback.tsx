interface PosterFallbackProps {
  title: string
  className?: string
}

export default function PosterFallback({ title, className }: PosterFallbackProps) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className ?? ''}`}
      style={{
        background:
          'linear-gradient(160deg, #14141a 0%, #0A0A0B 60%, #1C1C21 100%)',
        border: '1px solid rgba(184,149,42,0.12)',
        padding: '16px',
      }}
    >
      <p
        className="font-display italic text-center leading-tight"
        style={{
          color: '#F2ECD8',
          fontSize: 'clamp(0.9rem, 1.6vw, 1.25rem)',
        }}
      >
        {title}
      </p>
    </div>
  )
}
