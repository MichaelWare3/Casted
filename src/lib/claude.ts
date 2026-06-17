import Groq from 'groq-sdk'
import type {
  AlterEgoCharacter,
  DirectorAnswer,
  DirectorPick,
  QuizAnswer,
  QuizQuestion,
} from '../types'
import type { PoolCharacter } from './characters'

// In dev we can call Groq directly (no need to run the serverless functions
// locally). In production we always go through /api/groq so the key stays
// server-side and never ships to the browser.
const GROQ_DEV_DIRECT = import.meta.env.DEV && !!import.meta.env.VITE_GROQ_API_KEY
let groqClient: Groq | null = null
function devGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
    })
  }
  return groqClient
}

// Primary "creative" model and a faster, separately-metered fallback used when
// the primary hits its daily token limit (TPD). Routing through createJSON()
// means every feature degrades gracefully instead of throwing 429s.
const CREATIVE_MODEL = 'llama-3.3-70b-versatile'
const FALLBACK_MODEL = 'llama-3.1-8b-instant'

function isRateLimit(err: unknown): boolean {
  const e = err as { status?: number; code?: string; error?: { code?: string } } | undefined
  if (!e) return false
  if (e.status === 429) return true
  const code = e.code ?? e.error?.code
  return code === 'rate_limit_exceeded'
}

interface CompletionParams {
  system: string
  user: string
  temperature: number
  maxTokens: number
}

/**
 * Run a JSON completion. Tries the creative model first; if it's rate-limited
 * (e.g. daily token cap reached), automatically retries on the fallback model.
 */
async function createJSON({ system, user, temperature, maxTokens }: CompletionParams): Promise<string> {
  const messages = [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ]

  const runModel = async (model: string): Promise<string> => {
    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' as const },
    }
    if (GROQ_DEV_DIRECT) {
      const c = await devGroq().chat.completions.create(payload)
      return c.choices[0]?.message?.content ?? ''
    }
    const res = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const e = new Error(`Groq proxy error ${res.status}`) as Error & { status?: number }
      e.status = res.status
      throw e
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return data.choices?.[0]?.message?.content ?? ''
  }

  try {
    return await runModel(CREATIVE_MODEL)
  } catch (err) {
    if (isRateLimit(err)) {
      try {
        return await runModel(FALLBACK_MODEL)
      } catch (err2) {
        if (isRateLimit(err2)) {
          throw new Error(
            "CASTED's casting room is overbooked right now. Please try again in a little while.",
          )
        }
        throw err2
      }
    }
    throw err
  }
}

const ALTER_EGO_SYSTEM_PROMPT = `You are the casting director at CASTED.
Based on the user's answers, do two things:

1. Cast them as ONE iconic film character.

Cast from the COOLEST, most iconic characters in film history — the ones people would be hyped to get. Match the energy of their answers to a character with that same energy.

Draw from a deep, varied pool across eras and genres. ICONIC COOL examples to pull from (use these AND others like them):
- Tyler Durden (Fight Club) — chaos, charisma
- Vincent Vega / Jules Winnfield (Pulp Fiction) — cool
- The Dude (Big Lebowski) — effortless chill
- Ellen Ripley (Alien) — fearless
- Lisbeth Salander (Dragon Tattoo) — genius outsider
- Jack Sparrow (Pirates) — charming chaos
- Marla Singer (Fight Club) — dark wildcard
- Mia Wallace (Pulp Fiction) — magnetic
- John Wick — lethal calm
- Hannibal Lecter — terrifying intellect
- Anton Chigurh (No Country) — pure menace
- Amélie — whimsical romantic
- Travis Bickle (Taxi Driver) — lonely intensity
- Patrick Bateman (American Psycho) — polished danger
- Furiosa (Mad Max) — warrior
- Daniel Plainview (There Will Be Blood) — ambition
- Gatsby — romantic dreamer
- Tony Montana (Scarface) — hunger
- Clementine (Eternal Sunshine) — free spirit
- Léon (The Professional) — quiet loyalty
- Harley Quinn — chaotic fun
- Beatrix Kiddo / The Bride (Kill Bill) — vengeance
- Cool Hand Luke — nonconformist
- Jordan Belfort (Wolf of Wall Street) — excess

ALSO mix in under-the-radar cool characters from films people might not know, so some users discover someone new they deeply relate to. Roughly 70% recognizable icons, 30% deep cuts.

Match the character to the ANSWER PATTERN so the person feels genuinely seen — someone cool but ACCURATE to their vibe, not random.

2. Return a JSON object with this exact structure:
{
  "character_name": "Vincent Vega",
  "actor_name": "John Travolta",
  "film_of_origin": "Pulp Fiction",
  "year": 1994,
  "description": "Charismatic, unpredictable, living completely in the moment. You don't plan the night — you become it.",
  "tmdb_search_queries": ["Pulp Fiction", "Goodfellas", "Drive", "Collateral", "Heat", "The Departed"],
  "vibe_tags": ["Cool", "Unpredictable", "Stylish", "Night Energy"]
}

actor_name MUST be the real-world actor who originally played the character (e.g. "Jodie Foster" for Clarice Starling).

tmdb_search_queries should be 6 films that match the CHARACTER's energy and world —
not just films from the same genre. Think thematically and emotionally.
Return ONLY the JSON object. No explanation.`

const QUESTIONS_SYSTEM_PROMPT = `You are the casting director of CASTED. Your job is to find the film character living inside someone right now — not their favorite character, but the one they actually are tonight.

Generate 7 questions that make someone look inward. These are not personality quiz questions. They are mirrors. Each answer should feel like a small confession.

RULES:
- Questions must be quiet, specific, and real
- They reveal how someone actually moves through the world — their instincts, fears, desires, contradictions
- NOT about movies, genres, pop culture, or hypothetical scenarios
- NOT trendy or cringe — timeless and human
- Each option feels true to a different kind of person — no wrong answers, just different truths
- 3 options per question, each a window into a different character archetype
- The person should feel genuinely seen when their character is revealed

QUESTION TONE EXAMPLES:
Q: 'What do you do with pain you cannot explain?'
A: 'I go quiet and carry it alone' / 'I turn it into something — art, anger, movement' / 'I find someone to sit with me in it'

Q: 'What do people always get wrong about you?'
A: 'They think I am cold. I am just careful.' / 'They think I am fine. I am always working something out.' / 'They think I am too much. I think they are not enough.'

Q: 'When everything falls apart, your first instinct:'
A: 'Get very still and very clear' / 'Start moving — figure it out as I go' / 'Find the one person I actually trust'

Q: 'What are you most afraid of becoming?'
A: 'Someone who stopped feeling things' / 'Someone who never became what they could have been' / 'Someone who hurt people and called it survival'

Generate 7 fresh questions every session. Vary themes: identity, fear, desire, solitude, loyalty, ambition, love, the gap between who you are and who you show the world.

These questions should make someone put their phone down and actually think. That pause is the goal.

Return ONLY JSON:
{ "questions": [ { "id": 1, "question": "...", "options": ["...","...","..."] } ] }`

const DROP_CLUE_SYSTEM_PROMPT = `You are the voice of CASTED's Daily Drop.
Given a film's title, plot, and year, return a JSON object with:
1. "clue": Write ONE sentence maximum, 15 words or fewer. Cryptic, poetic, atmospheric. No character names. No plot details. Just pure mood and feeling. The clue should hit like a film poster tagline, not a plot summary. Do NOT name the title.
2. "mood_tags": exactly 3 short evocative tags (1-2 words each) capturing the film's tone. Examples: "Quiet", "Devastating", "Slow Burn", "Korean", "Magical", "Underseen".
Return ONLY the JSON object. No explanation.`

const DIRECTOR_SYSTEM_PROMPT = `You are The Director — the AI behind CASTED. Warm, excited, specific. Never recommend the obvious choice. Based on these answers pick ONE perfect film.
Return JSON only:
{
  "title": "",
  "year": 0,
  "tmdb_search": "",
  "director_name": "",
  "runtime_minutes": 0,
  "personal_reason": "",
  "vibe_tags": []
}`

function formatAnswersForLLM(answers: QuizAnswer[]): string {
  return answers
    .map((a, i) => `Q${i + 1}: ${a.question}\nAnswer: ${a.answer}`)
    .join('\n\n')
}

function formatDirectorAnswers(answers: DirectorAnswer[]): string {
  return answers.map((a, i) => `Q${i + 1}: ${a.question}\nAnswer: ${a.answer}`).join('\n\n')
}

export async function fetchAlterEgo(
  answers: QuizAnswer[],
  tasteBlock = '',
): Promise<AlterEgoCharacter> {
  const userContent = tasteBlock
    ? `${formatAnswersForLLM(answers)}\n\n${tasteBlock}\n\nWhen choosing the 6 tmdb_search_queries for this person's reel, lean toward films that match this taste profile while staying true to the cast character's world. Do not include films they have already seen.`
    : formatAnswersForLLM(answers)

  const text = await createJSON({
    system: ALTER_EGO_SYSTEM_PROMPT,
    user: userContent,
    temperature: 0.9,
    maxTokens: 1024,
  })

  if (!text) throw new Error('Empty response from AI')
  return JSON.parse(text) as AlterEgoCharacter
}

const LETTERS = ['A', 'B', 'C'] as const

// Hand-written fallback so the quiz always works, even when the AI is
// rate-limited or unavailable. Tone matches the generated questions.
const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt: 'What do you do with pain you cannot explain?',
    options: [
      { letter: 'A', text: 'I go quiet and carry it alone' },
      { letter: 'B', text: 'I turn it into something — art, anger, movement' },
      { letter: 'C', text: 'I find someone to sit with me in it' },
    ],
  },
  {
    id: 2,
    prompt: 'When everything falls apart, your first instinct:',
    options: [
      { letter: 'A', text: 'Get very still and very clear' },
      { letter: 'B', text: 'Start moving — figure it out as I go' },
      { letter: 'C', text: 'Find the one person I actually trust' },
    ],
  },
  {
    id: 3,
    prompt: 'What do people always get wrong about you?',
    options: [
      { letter: 'A', text: 'They think I am cold. I am just careful.' },
      { letter: 'B', text: 'They think I am fine. I am always working something out.' },
      { letter: 'C', text: 'They think I am too much. I think they are not enough.' },
    ],
  },
  {
    id: 4,
    prompt: 'What are you most afraid of becoming?',
    options: [
      { letter: 'A', text: 'Someone who stopped feeling things' },
      { letter: 'B', text: 'Someone who never became what they could have been' },
      { letter: 'C', text: 'Someone who hurt people and called it survival' },
    ],
  },
  {
    id: 5,
    prompt: 'Where do you feel most like yourself?',
    options: [
      { letter: 'A', text: 'Alone, somewhere quiet, late at night' },
      { letter: 'B', text: 'In the middle of something happening' },
      { letter: 'C', text: 'Across the table from someone who gets it' },
    ],
  },
  {
    id: 6,
    prompt: 'What pulls you forward?',
    options: [
      { letter: 'A', text: 'The need to understand how things really work' },
      { letter: 'B', text: 'The hunger to prove something to myself' },
      { letter: 'C', text: 'The people I refuse to let down' },
    ],
  },
  {
    id: 7,
    prompt: 'How do you love?',
    options: [
      { letter: 'A', text: 'Quietly, completely, without saying much' },
      { letter: 'B', text: 'All at once, like a door thrown open' },
      { letter: 'C', text: 'Loyally — once you are mine, you are mine' },
    ],
  },
]

let cachedQuestions: QuizQuestion[] | null = null

export async function generateAlterEgoQuestions(force = false): Promise<QuizQuestion[]> {
  // Reuse within the session so navigating back to Alter Ego doesn't re-spend tokens.
  if (cachedQuestions && !force) return cachedQuestions

  try {
    const text = await createJSON({
      system: QUESTIONS_SYSTEM_PROMPT,
      user: `Session seed: ${Math.random()}`,
      temperature: 1.0,
      maxTokens: 1536,
    })
    if (!text) throw new Error('Empty questions response from AI')

    interface RawQuestion {
      id?: number
      question?: string
      prompt?: string
      options: Array<string | { text?: string }>
    }
    const parsed = JSON.parse(text) as { questions: RawQuestion[] }
    const raw = Array.isArray(parsed?.questions) ? parsed.questions : []

    const questions: QuizQuestion[] = raw.map((q, i) => {
      const promptText = (q.question ?? q.prompt ?? '').trim()
      const opts = (q.options ?? []).slice(0, 3).map((o, idx) => ({
        letter: LETTERS[idx],
        text: typeof o === 'string' ? o : (o?.text ?? ''),
      }))
      return {
        id: typeof q.id === 'number' ? q.id : i + 1,
        prompt: promptText,
        options: opts,
      }
    })

    if (questions.length < 5 || questions.some((q) => !q.prompt || q.options.length !== 3)) {
      throw new Error(`Invalid questions payload (got ${questions.length})`)
    }

    cachedQuestions = questions
    return questions
  } catch (err) {
    // Never block the experience on question generation — fall back to a curated set.
    console.warn('[CASTED] question generation failed, using fallback set:', err)
    return cachedQuestions ?? FALLBACK_QUESTIONS
  }
}

export interface DropClueInput {
  title: string
  overview: string
  year: string | number
}

export interface DropClueResult {
  clue: string
  mood_tags: string[]
}

export async function generateDropClue(input: DropClueInput): Promise<DropClueResult> {
  const userText = `Title: ${input.title}\nYear: ${input.year}\nPlot: ${input.overview || '(no plot available)'}`

  const text = await createJSON({
    system: DROP_CLUE_SYSTEM_PROMPT,
    user: userText,
    temperature: 1.0,
    maxTokens: 400,
  })
  if (!text) throw new Error('Empty clue from AI')
  const parsed = JSON.parse(text) as DropClueResult
  const clue = (parsed?.clue ?? '').trim().replace(/^["“”']|["“”']$/g, '').trim()
  const moodTags = Array.isArray(parsed?.mood_tags) ? parsed.mood_tags.slice(0, 3) : []

  if (!clue) throw new Error('Empty clue text from AI')
  return { clue, mood_tags: moodTags }
}

export async function fetchDirectorPick(
  answers: DirectorAnswer[],
  genre?: string,
  tasteBlock = '',
): Promise<DirectorPick> {
  const parts: string[] = []
  if (genre) parts.push(`Preferred genre: ${genre}`)
  parts.push(formatDirectorAnswers(answers))
  if (tasteBlock) {
    parts.push(`${tasteBlock}\n\nFactor this taste into your single pick. Do not pick a film they have already seen.`)
  }

  const text = await createJSON({
    system: DIRECTOR_SYSTEM_PROMPT,
    user: parts.join('\n\n'),
    temperature: 0.95,
    maxTokens: 1024,
  })

  if (!text) throw new Error('Empty response from AI')
  return JSON.parse(text) as DirectorPick
}

const FOR_YOU_SYSTEM_PROMPT = `You are the head of recommendations at CASTED, a premium film discovery service.
Given a viewer's taste profile, recommend 8 films they will love but have NOT already seen.
Rules:
- Match the texture of what they love — tone, era, pacing, sensibility — not just genre.
- Avoid the obvious blockbuster unless it genuinely fits their taste.
- Never include any film listed as loved, watched, or disliked — they know those already.
- Favor a mix: a few safe-but-great picks and a couple of discoveries they likely haven't found.
Return ONLY JSON: { "films": ["Title (Year)", "Title (Year)", ...] } with exactly 8 entries.`

export async function fetchForYouTitles(tasteBlock: string): Promise<string[]> {
  const text = await createJSON({
    system: FOR_YOU_SYSTEM_PROMPT,
    user: tasteBlock,
    temperature: 0.9,
    maxTokens: 700,
  })
  if (!text) throw new Error('Empty For You response from AI')
  const parsed = JSON.parse(text) as { films?: string[] }
  const films = Array.isArray(parsed.films) ? parsed.films : []
  return films.filter((f): f is string => typeof f === 'string' && f.trim().length > 0).slice(0, 8)
}

const CASTING_SYSTEM_PROMPT = `You are the casting director at CASTED. You are given a person's answers to an introspective quiz and a SHORTLIST of film characters (each with an [id], film, essence, and traits).

Your job:
1. Choose the ONE character from the shortlist whose inner life best matches this person — their instincts, fears, contradictions. Pick the truest fit, not the most famous. A darker or villainous character is a valid, exciting choice if their answers genuinely fit it. You MUST pick an id that appears in the shortlist.
2. Write "description": 2–3 sentences, second person ("You…"), that mirror the SPECIFIC choices they made so it feels written about them, not generic. End by naming the character. Cinematic, intimate, no clichés.
3. Write "match_line": one short line (max 14 words) naming the trait that binds them to the character. e.g. "You and Jef share a lethal kind of patience."

Return ONLY JSON: { "id": "<one id from the shortlist>", "description": "...", "match_line": "..." }`

export interface CastResult {
  id: string
  description: string
  match_line: string
}

export async function castFromCandidates(
  candidates: PoolCharacter[],
  answers: QuizAnswer[],
  tasteBlock = '',
): Promise<CastResult> {
  const roster = candidates
    .map((c) => `[${c.id}] ${c.name} — ${c.film} (${c.year}) :: ${c.essence} :: traits: ${c.tags.join(', ')}`)
    .join('\n')

  const user = [
    formatAnswersForLLM(answers),
    tasteBlock,
    `SHORTLIST (choose exactly one id):\n${roster}`,
  ]
    .filter(Boolean)
    .join('\n\n')

  const text = await createJSON({
    system: CASTING_SYSTEM_PROMPT,
    user,
    temperature: 0.9,
    maxTokens: 600,
  })
  if (!text) throw new Error('Empty casting response from AI')
  const parsed = JSON.parse(text) as { id?: string; description?: string; match_line?: string }
  if (!parsed.id) throw new Error('Casting returned no id')
  return {
    id: parsed.id,
    description: (parsed.description ?? '').trim(),
    match_line: (parsed.match_line ?? '').trim(),
  }
}
