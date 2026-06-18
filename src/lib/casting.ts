import type { AlterEgoCharacter, QuizAnswer } from '../types'
import { CHARACTER_POOL, type PoolCharacter } from './characters'
import { castFromCandidates } from './claude'
import type { CastOption } from './castQuestions'
import { addToCastHistory, readCastHistory } from './castHistory'

export interface CastSelection {
  question: string
  option: CastOption
}

// ── Trait model ──────────────────────────────────────────────────────────────
// A shared vocabulary of traits. Both the quiz options (castQuestions.ts) and
// every character are scored on these, so matching is a deterministic vector
// comparison — the same answers always map to the same best character.

const VOCAB = new Set([
  'calm', 'intense', 'melancholy', 'joyful', 'angry', 'anxious', 'weary',
  'controlled', 'impulsive', 'solitary', 'social', 'loyal', 'free', 'ambitious',
  'romantic', 'cerebral', 'dark', 'tender', 'fearless', 'principled', 'whimsical',
  'magnetic', 'vengeful', 'protective', 'rebellious', 'wounded',
])

// Map each curated character tag onto canonical traits (tags are strong signal).
const TAG_TO_TRAITS: Record<string, string[]> = {
  solitary: ['solitary'],
  still: ['calm', 'controlled'],
  controlled: ['controlled'],
  cool: ['calm', 'magnetic'],
  principled: ['principled'],
  melancholy: ['melancholy'],
  romantic: ['romantic'],
  wounded: ['wounded', 'melancholy'],
  kinetic: ['impulsive', 'intense'],
  vengeful: ['vengeful', 'angry'],
  fearless: ['fearless'],
  protector: ['protective', 'loyal'],
  survivor: ['fearless', 'weary'],
  leader: ['principled', 'magnetic'],
  dark: ['dark'],
  chaotic: ['impulsive', 'rebellious'],
  magnetic: ['magnetic'],
  rebellious: ['rebellious', 'free'],
  cerebral: ['cerebral'],
  outsider: ['solitary', 'rebellious'],
  emotional: ['intense', 'tender'],
  tender: ['tender'],
  dreamer: ['whimsical', 'romantic'],
  whimsical: ['whimsical', 'joyful'],
  free: ['free'],
  ambitious: ['ambitious'],
  ruthless: ['dark', 'ambitious'],
  loyal: ['loyal'],
  menacing: ['dark', 'intense'],
  fearful: ['anxious'],
  light: ['joyful'],
  social: ['social'],
  dutiful: ['principled', 'loyal'],
  seeker: ['cerebral'],
  wild: ['impulsive', 'free'],
  warm: ['tender', 'joyful'],
  calm: ['calm'],
  intense: ['intense'],
  joyful: ['joyful'],
  guarded: ['controlled', 'solitary'],
}

// Secondary signal: scan a character's essence + vibe words for these keywords.
const KEYWORD_TO_TRAIT: Record<string, string[]> = {
  calm: ['calm', 'still', 'quiet', 'composed', 'serene', 'patient', 'collected', 'monastic'],
  intense: ['intense', 'fierce', 'burning', 'feral', 'volatile', 'relentless', 'obsess', 'manic', 'lethal'],
  melancholy: ['melanchol', 'lonely', 'grief', 'sorrow', 'aching', 'haunt', 'wistful', 'sad'],
  joyful: ['joy', 'warm', 'bright', 'playful', 'charming', 'effervescent', 'light'],
  angry: ['anger', 'rage', 'fury', 'wrath', 'vengeance', 'ruthless'],
  anxious: ['anxious', 'afraid', 'nervous', 'dread', 'paranoi', 'fearful'],
  weary: ['weary', 'tired', 'worn', 'exhausted', 'jaded', 'burdened'],
  controlled: ['control', 'disciplin', 'precise', 'measured', 'methodical', 'composed', 'strateg', 'ritual'],
  impulsive: ['impuls', 'reckless', 'wild', 'spontaneous', 'chaos', 'untamed'],
  solitary: ['solitary', 'alone', 'lone', 'outsider', 'isolated', 'loner'],
  social: ['people', 'crowd', 'gregarious', 'room', 'charm'],
  loyal: ['loyal', 'devotion', 'devoted', 'faithful', 'family'],
  free: ['free', 'untether', 'independ', 'wander', 'escape', 'no rules'],
  ambitious: ['ambition', 'driven', 'hunger', 'power', 'succeed', 'greatness'],
  romantic: ['romant', 'love', 'longing', 'yearning'],
  cerebral: ['intellect', 'genius', 'clever', 'mind', 'cerebral', 'analytic', 'enigmat'],
  dark: ['dark', 'menac', 'sinister', 'ruthless', 'villain', 'monstrous', 'cruel', 'cold'],
  tender: ['tender', 'gentle', 'kind', 'caring', 'soft', 'compassion'],
  fearless: ['fearless', 'brave', 'bold', 'daring', 'courage', 'unflinching'],
  principled: ['principle', 'honor', 'code', 'integrity', 'moral', 'just', 'duty', 'dutiful'],
  whimsical: ['whimsy', 'whimsical', 'quirky', 'eccentric', 'dream'],
  magnetic: ['magnetic', 'charisma', 'presence', 'captivat', 'alluring'],
  vengeful: ['vengeance', 'vengeful', 'revenge', 'retribution'],
  protective: ['protect', 'guardian', 'shield', 'defend', 'provider'],
  rebellious: ['rebel', 'defiant', 'nonconform', 'refuse', 'anarch'],
  wounded: ['wound', 'broken', 'scar', 'trauma', 'damaged', 'hurt'],
}

type Vec = Record<string, number>

function addTrait(v: Vec, t: string, w: number) {
  if (!VOCAB.has(t)) return
  v[t] = (v[t] ?? 0) + w
}

const characterVectorCache = new Map<string, Vec>()

function characterVector(c: PoolCharacter): Vec {
  const cached = characterVectorCache.get(c.id)
  if (cached) return cached

  const v: Vec = {}
  for (const tag of c.tags) {
    const mapped = TAG_TO_TRAITS[tag] ?? (VOCAB.has(tag) ? [tag] : [])
    for (const t of mapped) addTrait(v, t, 2)
  }
  const text = `${c.essence} ${c.vibe.join(' ')}`.toLowerCase()
  for (const [trait, kws] of Object.entries(KEYWORD_TO_TRAIT)) {
    if (kws.some((k) => text.includes(k))) addTrait(v, trait, 1)
  }

  characterVectorCache.set(c.id, v)
  return v
}

function userVector(selections: CastSelection[]): Vec {
  const v: Vec = {}
  for (const s of selections) {
    for (const [t, w] of Object.entries(s.option.traits)) addTrait(v, t, w)
  }
  return v
}

function magnitude(v: Vec): number {
  let sum = 0
  for (const k in v) sum += v[k] * v[k]
  return Math.sqrt(sum)
}

function cosine(a: Vec, b: Vec): number {
  let dot = 0
  for (const k in a) if (b[k]) dot += a[k] * b[k]
  const denom = magnitude(a) * magnitude(b)
  return denom === 0 ? 0 : dot / denom
}

// ── Reveal helpers ───────────────────────────────────────────────────────────

function toCharacter(c: PoolCharacter, description: string, matchLine: string): AlterEgoCharacter {
  return {
    character_name: c.name,
    actor_name: c.actor,
    film_of_origin: c.film,
    year: c.year,
    description,
    match_line: matchLine,
    tmdb_search_queries: c.reel,
    vibe_tags: c.vibe,
  }
}

function fallbackDescription(c: PoolCharacter): string {
  return `${c.essence} That particular way of moving through the world — it's yours too. Tonight, you are ${c.name}.`
}

function fallbackMatchLine(c: PoolCharacter): string {
  const trait = c.tags[0] ?? 'spirit'
  return `You and ${c.name.split(' ')[0]} share the same ${trait} streak.`
}

function answersFrom(selections: CastSelection[]): QuizAnswer[] {
  return selections.map((s) => ({ question: s.question, answer: s.option.label }))
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Cast the viewer from their trait answers.
 * - Deterministic: builds a trait vector from the chosen options and picks the
 *   closest-matching character by cosine similarity — same answers, same match.
 * - "Avoid recent few": skips the viewer's last 5 casts when picking.
 * - AI writes the personal reveal (with a templated fallback when unavailable).
 */
export async function castAlterEgo(
  selections: CastSelection[],
  tasteBlock = '',
): Promise<AlterEgoCharacter> {
  const profile = userVector(selections)
  const recent = new Set(readCastHistory().slice(-5))

  const ranked = CHARACTER_POOL.map((c) => ({ c, score: cosine(profile, characterVector(c)) })).sort(
    (a, b) => b.score - a.score,
  )

  // Best match, skipping the last few casts — but never return nothing.
  const chosen = (ranked.find((r) => !recent.has(r.c.id)) ?? ranked[0]).c
  addToCastHistory(chosen.id)

  const answers = answersFrom(selections)
  try {
    const result = await castFromCandidates([chosen], answers, tasteBlock)
    const description = result.description || fallbackDescription(chosen)
    const matchLine = result.match_line || fallbackMatchLine(chosen)
    return toCharacter(chosen, description, matchLine)
  } catch (err) {
    console.warn('[CASTED] AI reveal failed, using template:', err)
    return toCharacter(chosen, fallbackDescription(chosen), fallbackMatchLine(chosen))
  }
}
