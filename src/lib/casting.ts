import type { AlterEgoCharacter, QuizAnswer } from '../types'
import { CHARACTER_POOL, type PoolCharacter } from './characters'
import { castFromCandidates } from './claude'
import { addToCastHistory, readCastHistory, resetCastHistory } from './castHistory'

// Trigger words that hint a viewer's answers lean toward a given trait. Used for
// (a) building a strong-but-varied shortlist and (b) the no-AI fallback pick.
const TRAIT_SIGNALS: Record<string, string[]> = {
  solitary: ['alone', 'quiet', 'myself', 'solitude', 'withdraw', 'isolat', 'on my own'],
  social: ['friends', 'people', 'together', 'someone', 'others', 'company'],
  still: ['still', 'calm', 'wait', 'patien', 'observe', 'watch', 'clear'],
  kinetic: ['move', 'run', 'figure it out', 'momentum', 'go', 'act'],
  controlled: ['control', 'plan', 'careful', 'composed', 'measured', 'collected'],
  chaotic: ['chaos', 'wild', 'impuls', 'messy', 'reckless', 'spontan'],
  cerebral: ['think', 'understand', 'figure', 'mind', 'analy', 'clever', 'work it out'],
  emotional: ['feel', 'heart', 'cry', 'emotion', 'overwhelm', 'too much'],
  dark: ['dark', 'hurt', 'cold', 'danger', 'survival', 'alone in it'],
  light: ['hope', 'joy', 'warm', 'laugh', 'kind', 'bright'],
  romantic: ['love', 'longing', 'devot', 'someone i', 'romance'],
  ruthless: ['win', 'power', 'whatever it takes', 'ruthless'],
  loyal: ['trust', 'loyal', 'protect', 'family', 'stand by', 'people i'],
  free: ['free', 'escape', 'wander', 'no rules', 'untether'],
  ambitious: ['prove', 'great', 'more', 'succeed', 'become', 'ambition'],
  fearful: ['afraid', 'fear', 'scared', 'anxious', 'worry'],
  fearless: ['fearless', 'brave', 'face it', 'head on', 'dive in'],
  tender: ['gentle', 'tender', 'soft', 'care', 'sit with', 'kind'],
  vengeful: ['revenge', 'make them pay', 'vengeance', 'even', 'justice'],
  seeker: ['meaning', 'why', 'search', 'understand', 'question'],
  protector: ['protect', 'take care', 'shield', 'family', 'others'],
  dreamer: ['dream', 'imagine', 'someday', 'wonder', 'what could'],
  survivor: ['survive', 'endure', 'get through', 'carry', 'keep going'],
  outsider: ['different', 'do not belong', "don't belong", 'misfit', 'outsider'],
  leader: ['lead', 'responsib', 'take charge', 'decide', 'in charge'],
  principled: ['right', 'honor', 'principle', 'code', 'should', 'wrong'],
  magnetic: ['attention', 'charm', 'presence', 'draw', 'pull'],
  wounded: ['pain', 'hurt', 'broken', 'scar', 'loss', 'wound'],
  melancholy: ['sad', 'melanchol', 'ache', 'lonely', 'quiet sadness'],
  rebellious: ['rebel', 'rules', 'authority', 'defy', 'refuse', 'break'],
  dutiful: ['duty', 'obligation', 'expected', 'responsib'],
  whimsical: ['playful', 'fun', 'silly', 'curious', 'wonder'],
  cool: ['cool', 'calm', 'unbothered', 'effortless', 'collected'],
  wild: ['wild', 'untamed', 'feral', 'instinct'],
}

function answerText(answers: QuizAnswer[]): string {
  return answers.map((a) => a.answer).join(' \n ').toLowerCase()
}

function scoreCharacter(c: PoolCharacter, text: string): number {
  let score = 0
  for (const tag of c.tags) {
    const signals = TRAIT_SIGNALS[tag]
    if (signals && signals.some((s) => text.includes(s))) score += 1
  }
  return score
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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
  return `${c.essence} That restraint, that pull, that particular way of moving through the night — it's yours too. Tonight, you are ${c.name}.`
}

function fallbackMatchLine(c: PoolCharacter): string {
  const trait = c.tags[0] ?? 'spirit'
  return `You and ${c.name.split(' ')[0]} share the same ${trait} streak.`
}

/**
 * Cast the viewer as a character from the curated pool.
 * - Excludes everyone they've already been cast as (never repeats until the
 *   pool is exhausted, then resets).
 * - Builds a strong-but-varied shortlist, lets the AI pick the truest fit and
 *   write a personal reveal; falls back to deterministic trait-matching if the
 *   AI is unavailable (e.g. rate-limited).
 */
export async function castAlterEgo(
  answers: QuizAnswer[],
  tasteBlock = '',
): Promise<AlterEgoCharacter> {
  const history = readCastHistory()
  let allowed = CHARACTER_POOL.filter((c) => !history.includes(c.id))
  if (allowed.length < 8) {
    resetCastHistory()
    allowed = CHARACTER_POOL
  }

  const text = answerText(answers)
  const scored = allowed
    .map((c) => ({ c, score: scoreCharacter(c, text) }))
    .sort((a, b) => b.score - a.score)

  // Strong fits + a spray of wildcards keeps it accurate AND spontaneous.
  const strong = scored.slice(0, 14).map((s) => s.c)
  const rest = scored.slice(14).map((s) => s.c)
  const wildcards = shuffle(rest).slice(0, 10)
  const shortlist = shuffle([...strong, ...wildcards])

  try {
    const result = await castFromCandidates(shortlist, answers, tasteBlock)
    const chosen =
      CHARACTER_POOL.find((c) => c.id === result.id) ??
      shortlist.find((c) => c.id === result.id)
    if (chosen) {
      addToCastHistory(chosen.id)
      const description = result.description || fallbackDescription(chosen)
      const matchLine = result.match_line || fallbackMatchLine(chosen)
      return toCharacter(chosen, description, matchLine)
    }
    // AI returned an unknown id — fall through to deterministic pick.
  } catch (err) {
    console.warn('[CASTED] AI casting failed, using deterministic match:', err)
  }

  // Deterministic fallback: weighted-random among the best-scoring shortlisted.
  const ranked = shortlist
    .map((c) => ({ c, score: scoreCharacter(c, text) }))
    .sort((a, b) => b.score - a.score)
  const topScore = ranked[0]?.score ?? 0
  const pickFrom = topScore > 0 ? ranked.filter((r) => r.score >= Math.max(1, topScore - 1)) : ranked
  const chosen = pickFrom[Math.floor(Math.random() * pickFrom.length)].c
  addToCastHistory(chosen.id)
  return toCharacter(chosen, fallbackDescription(chosen), fallbackMatchLine(chosen))
}
