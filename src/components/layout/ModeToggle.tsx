import { useMode } from '../../hooks/useMode'

export default function ModeToggle() {
  const { mode, setMode } = useMode()
  const isFilmHead = mode === 'film-head'

  const base =
    'relative px-5 py-2 font-body text-[10px] uppercase tracking-[0.3em] transition-colors duration-300 sm:text-[11px]'
  const active = 'text-casted-gold'
  const inactive = 'text-casted-muted hover:text-casted-cream/80'

  return (
    <div
      role="tablist"
      aria-label="Viewing mode"
      className="inline-flex items-center gap-1 rounded-full border border-casted-cream/10 bg-casted-black/70 px-1.5 py-1 backdrop-blur-sm"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!isFilmHead}
        onClick={() => setMode('just-watch')}
        className={`${base} ${!isFilmHead ? active : inactive}`}
      >
        Just Watch
        {!isFilmHead && (
          <span className="absolute inset-x-4 -bottom-0.5 h-px bg-casted-gold" />
        )}
      </button>

      <span className="h-3 w-px bg-casted-cream/15" aria-hidden="true" />

      <button
        type="button"
        role="tab"
        aria-selected={isFilmHead}
        onClick={() => setMode('film-head')}
        className={`${base} ${isFilmHead ? active : inactive}`}
      >
        Film Head
        {isFilmHead && (
          <span className="absolute inset-x-4 -bottom-0.5 h-px bg-casted-gold" />
        )}
      </button>
    </div>
  )
}
