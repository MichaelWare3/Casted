import { CHARACTER_POOL, type PoolCharacter } from './characters'
import { readCastHistory } from './castHistory'

/** The characters you've been cast as, most recent first, de-duplicated. */
export function getCastCharacters(): PoolCharacter[] {
  const byId = new Map(CHARACTER_POOL.map((c) => [c.id, c]))
  const seen = new Set<string>()
  const out: PoolCharacter[] = []
  for (const id of readCastHistory().slice().reverse()) {
    if (seen.has(id)) continue
    seen.add(id)
    const c = byId.get(id)
    if (c) out.push(c)
  }
  return out
}

const TRAIT_ADJ: Record<string, string> = {
  calm: 'calm', intense: 'intense', melancholy: 'melancholy', joyful: 'warm',
  angry: 'fiery', anxious: 'restless', weary: 'weathered', controlled: 'composed',
  impulsive: 'impulsive', solitary: 'solitary', social: 'magnetic', loyal: 'loyal',
  free: 'free-spirited', ambitious: 'ambitious', romantic: 'romantic', cerebral: 'sharp',
  dark: 'shadowed', tender: 'tender', fearless: 'fearless', principled: 'principled',
  whimsical: 'whimsical', magnetic: 'magnetic', vengeful: 'vengeful', protective: 'protective',
  rebellious: 'rebellious', wounded: 'wounded', cool: 'cool', still: 'still',
  kinetic: 'kinetic', dreamer: 'dreaming', survivor: 'unbreakable', leader: 'commanding',
  outsider: 'outsider', seeker: 'searching', ruthless: 'ruthless', menacing: 'dangerous',
  dutiful: 'devoted', light: 'bright', wild: 'wild', warm: 'warm', guarded: 'guarded',
  chaotic: 'chaotic', emotional: 'feeling',
}

/** The most common traits across the characters you've been cast as. */
export function topTraits(chars: PoolCharacter[], n = 6): string[] {
  const counts: Record<string, number> = {}
  for (const c of chars) for (const t of c.tags) counts[t] = (counts[t] ?? 0) + 1
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([t]) => t)
}

/** A one-line poetic summary of your screen self. */
export function identityLine(chars: PoolCharacter[]): string {
  if (chars.length === 0) return 'Your cinema is just beginning.'
  const adjs = topTraits(chars, 3).map((t) => TRAIT_ADJ[t] ?? t)
  if (adjs.length === 0) return 'A one-of-a-kind screen presence.'
  return `A ${adjs.join(', ')} kind of soul.`
}

/** Trait tags as display labels for the taste fingerprint. */
export function fingerprintTags(chars: PoolCharacter[]): string[] {
  return topTraits(chars, 7).map((t) => TRAIT_ADJ[t] ?? t)
}
