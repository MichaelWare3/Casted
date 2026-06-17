import type { TheaterMovie } from '../types'

export interface TasteProfile {
  /** Titles the viewer rated 4–5 stars. */
  loved: string[]
  /** Titles the viewer rated 1–2 stars — steer away from these. */
  disliked: string[]
  /** Other watched titles (rated 3, or watched without a rating) — mild positive. */
  alsoWatched: string[]
  /** True when there's no real history and `loved` was seeded from trending. */
  coldStart: boolean
}

export const EMPTY_TASTE: TasteProfile = {
  loved: [],
  disliked: [],
  alsoWatched: [],
  coldStart: false,
}

function withYear(m: TheaterMovie): string {
  return m.year ? `${m.title} (${m.year})` : m.title
}

/** Derive a ratings-weighted taste profile from the Theater store. */
export function buildTasteFromTheater(theater: TheaterMovie[]): TasteProfile {
  const sorted = [...theater].sort(
    (a, b) => (b.watched_at ?? b.added_at) - (a.watched_at ?? a.added_at),
  )

  const loved: string[] = []
  const disliked: string[] = []
  const alsoWatched: string[] = []

  for (const m of sorted) {
    if (typeof m.rating === 'number' && m.rating >= 4) loved.push(withYear(m))
    else if (typeof m.rating === 'number' && m.rating <= 2) disliked.push(withYear(m))
    else if (m.watched) alsoWatched.push(withYear(m))
  }

  return {
    loved: loved.slice(0, 12),
    disliked: disliked.slice(0, 8),
    alsoWatched: alsoWatched.slice(0, 10),
    coldStart: false,
  }
}

export function hasTasteHistory(t: TasteProfile): boolean {
  return t.loved.length + t.disliked.length + t.alsoWatched.length > 0
}

/** All titles the viewer has already seen — used to forbid re-recommending them. */
export function seenTitles(t: TasteProfile): string[] {
  return [...t.loved, ...t.alsoWatched, ...t.disliked]
}

/**
 * Render the profile as a prompt block for the LLM. Returns '' when there's
 * nothing to personalize on, so callers can cleanly fall back to generic output.
 */
export function tasteToPromptBlock(t: TasteProfile): string {
  if (!hasTasteHistory(t)) return ''

  const lines: string[] = ['VIEWER TASTE PROFILE — tailor your choice to this person:']
  if (t.loved.length) {
    lines.push(
      t.coldStart
        ? `Currently enjoying (trending starting points — weight loosely): ${t.loved.join(', ')}`
        : `Loved (rated highly): ${t.loved.join(', ')}`,
    )
  }
  if (t.alsoWatched.length) lines.push(`Also watched: ${t.alsoWatched.join(', ')}`)
  if (t.disliked.length) lines.push(`Disliked — avoid this energy: ${t.disliked.join(', ')}`)
  lines.push('Never recommend a film already listed above; they have seen it.')
  return lines.join('\n')
}
