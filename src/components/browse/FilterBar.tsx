import { motion } from 'framer-motion'
import {
  BROWSE_COUNTRIES,
  BROWSE_ERAS,
  BROWSE_GENRES,
  BROWSE_MIN_RATINGS,
  BROWSE_RUNTIMES,
  type BrowseFilters,
} from '../../lib/tmdb'

interface FilterBarProps {
  filters: BrowseFilters
  hiddenGems: boolean
  onChange: (next: BrowseFilters) => void
  onToggleHiddenGems: () => void
  onReset: () => void
}

export default function FilterBar({
  filters,
  hiddenGems,
  onChange,
  onToggleHiddenGems,
  onReset,
}: FilterBarProps) {
  const update = <K extends keyof BrowseFilters>(key: K, value: BrowseFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const isActive =
    !!filters.genre ||
    !!filters.era ||
    !!filters.country ||
    !!filters.runtime ||
    filters.minRating != null ||
    hiddenGems

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex w-full flex-col gap-3"
    >
      <ChipRow
        label="Genre"
        value={filters.genre}
        options={BROWSE_GENRES as readonly string[]}
        onSelect={(v) => update('genre', v)}
      />
      <ChipRow
        label="Era"
        value={filters.era}
        options={BROWSE_ERAS as readonly string[]}
        onSelect={(v) => update('era', v)}
      />
      <ChipRow
        label="Country"
        value={filters.country}
        options={BROWSE_COUNTRIES as readonly string[]}
        onSelect={(v) => update('country', v)}
      />
      <ChipRow
        label="Runtime"
        value={filters.runtime}
        options={BROWSE_RUNTIMES as readonly string[]}
        onSelect={(v) => update('runtime', v)}
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="font-body text-[10px] uppercase tracking-[0.3em] text-casted-cream/45">
            Min Rating
          </span>
          {BROWSE_MIN_RATINGS.map((r) => (
            <Chip
              key={r}
              label={`${r}+`}
              active={filters.minRating === r}
              onClick={() => update('minRating', filters.minRating === r ? null : r)}
            />
          ))}
        </div>

        <Toggle
          label="Hidden Gems"
          on={hiddenGems}
          onClick={onToggleHiddenGems}
        />

        {isActive && (
          <button
            type="button"
            onClick={onReset}
            className="font-body text-[10px] uppercase tracking-[0.3em] text-casted-cream/50 transition-colors hover:text-casted-cream"
          >
            Reset
          </button>
        )}
      </div>
    </motion.div>
  )
}

interface ChipRowProps {
  label: string
  value: string | null
  options: readonly string[]
  onSelect: (value: string | null) => void
}

function ChipRow({ label, value, options, onSelect }: ChipRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="font-body text-[10px] uppercase tracking-[0.3em] text-casted-cream/45"
        style={{ minWidth: '72px' }}
      >
        {label}
      </span>
      {options.map((opt) => (
        <Chip
          key={opt}
          label={opt}
          active={value === opt}
          onClick={() => onSelect(value === opt ? null : opt)}
        />
      ))}
    </div>
  )
}

interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
}

function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-body text-[10px] uppercase tracking-widest"
      style={{
        padding: '6px 12px',
        background: active ? 'rgba(184,149,42,0.18)' : 'transparent',
        border: active ? '1px solid #B8952A' : '1px solid rgba(255,255,255,0.08)',
        color: active ? '#F2ECD8' : 'rgba(242,236,216,0.55)',
        borderRadius: '9999px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  )
}

interface ToggleProps {
  label: string
  on: boolean
  onClick: () => void
}

function Toggle({ label, on, onClick }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.3em]"
      style={{ color: on ? '#F2ECD8' : 'rgba(242,236,216,0.55)' }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '32px',
          height: '18px',
          borderRadius: '9999px',
          background: on ? '#B8952A' : 'rgba(255,255,255,0.08)',
          border: '1px solid ' + (on ? '#B8952A' : 'rgba(255,255,255,0.12)'),
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: on ? '15px' : '2px',
            width: '12px',
            height: '12px',
            borderRadius: '9999px',
            background: on ? '#0A0A0B' : '#F2ECD8',
            transition: 'left 0.2s ease, background 0.2s ease',
          }}
        />
      </span>
      {label}
    </button>
  )
}
