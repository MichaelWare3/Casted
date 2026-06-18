import type { TMDBMovie, TMDBMovieDetails, TMDBSearchResponse, TMDBVideo } from '../types'

const TMDB_BASE = 'https://api.themoviedb.org/3'
export const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500'
export const TMDB_IMG_LARGE = 'https://image.tmdb.org/t/p/w780'

function getKey(): string {
  const key = import.meta.env.VITE_TMDB_API_KEY
  if (!key || key === 'your_tmdb_key_here') {
    throw new Error('Missing VITE_TMDB_API_KEY')
  }
  return key
}

// In dev, call TMDB directly with the VITE key. In production, route through the
// /api/tmdb serverless proxy so TMDB_API_KEY stays server-side.
const USE_TMDB_DIRECT = import.meta.env.DEV && !!import.meta.env.VITE_TMDB_API_KEY

type TmdbParams = Record<string, string | number | boolean>

function tmdbFetch(path: string, params: TmdbParams = {}): Promise<Response> {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) search.set(k, String(v))
  if (USE_TMDB_DIRECT) {
    search.set('api_key', getKey())
    return fetch(`${TMDB_BASE}${path}?${search.toString()}`)
  }
  // Flat serverless function takes the TMDB path as a query param (more reliable
  // on Vercel than a catch-all route).
  search.set('path', path)
  return fetch(`/api/tmdb?${search.toString()}`)
}

export async function searchMovie(query: string): Promise<TMDBMovie | null> {
  const res = await tmdbFetch('/search/movie', { query, include_adult: 'false' })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[CASTED] ❌ TMDB search failed', res.status, body)
    throw new Error(`TMDB search failed ${res.status}`)
  }
  const data: TMDBSearchResponse = await res.json()
  const hit = data.results?.[0] ?? null

  return hit
}

export async function searchMovies(queries: string[]): Promise<TMDBMovie[]> {

  const results = await Promise.all(
    queries.map((q) =>
      searchMovie(q).catch((err) => {
        console.error(`[CASTED] ❌ searchMovie "${q}" rejected:`, err)
        return null
      }),
    ),
  )
  const movies = results.filter((m): m is TMDBMovie => m !== null)

  return movies
}

export async function fetchTrending(): Promise<TMDBMovie[]> {
  const res = await tmdbFetch('/trending/movie/day')
  if (!res.ok) throw new Error(`TMDB trending failed ${res.status}`)
  const data: TMDBSearchResponse = await res.json()
  return data.results ?? []
}

export async function fetchMovieDetails(movieId: number): Promise<TMDBMovieDetails | null> {
  const res = await tmdbFetch(`/movie/${movieId}`, { append_to_response: 'credits' })
  if (!res.ok) {
    console.error('[CASTED] ❌ TMDB details failed', res.status)
    return null
  }
  return (await res.json()) as TMDBMovieDetails
}

export function getDirectorName(details: TMDBMovieDetails | null): string {
  if (!details?.credits?.crew) return ''
  const director = details.credits.crew.find((c) => c.job === 'Director')
  return director?.name ?? ''
}

const DISCOVER_LANGUAGES = ['en', 'fr', 'ko', 'ja', 'it', 'es', 'da'] as const

export async function fetchHiddenGem(seed: number): Promise<TMDBMovieDetails | null> {
  const lang = DISCOVER_LANGUAGES[seed % DISCOVER_LANGUAGES.length]
  const page = (seed % 15) + 1
  const res = await tmdbFetch('/discover/movie', {
    sort_by: 'vote_average.desc',
    'vote_count.gte': '80',
    'vote_count.lte': '800',
    'vote_average.gte': '7.2',
    with_original_language: lang,
    without_genres: '99,10402',
    include_adult: 'false',
    page,
  })
  if (!res.ok) {
    console.error('[CASTED] ❌ TMDB discover failed', res.status)
    return null
  }
  const data: TMDBSearchResponse = await res.json()
  const results = data.results ?? []
  if (results.length === 0) return null
  const picked = results[seed % results.length]

  return fetchMovieDetails(picked.id)
}

export async function fetchMovieTrailer(movieId: number): Promise<TMDBVideo | null> {
  const res = await tmdbFetch(`/movie/${movieId}/videos`)
  if (!res.ok) return null
  const data = await res.json()
  const videos: TMDBVideo[] = data?.results ?? []
  return (
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube') ||
    null
  )
}

export function posterUrl(path: string | null, size: 'medium' | 'large' = 'medium'): string | null {
  if (!path) return null
  return `${size === 'large' ? TMDB_IMG_LARGE : TMDB_IMG_BASE}${path}`
}

// ── Where to watch (streaming availability) ──────────────────────────────────
// Powered by TMDB's /watch/providers endpoint, whose data comes from JustWatch.
// Per TMDB terms, any UI using this data MUST attribute JustWatch as the source.

const TMDB_PROVIDER_LOGO_BASE = 'https://image.tmdb.org/t/p/w92'

export interface WatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string | null
}

export interface WatchProviders {
  /** Aggregate JustWatch-powered TMDB watch page for this title. */
  link: string | null
  /** Subscription / included-with-service streaming (plus free + ad-supported). */
  flatrate: WatchProvider[]
  rent: WatchProvider[]
  buy: WatchProvider[]
}

export function providerLogoUrl(path: string | null): string | null {
  if (!path) return null
  return `${TMDB_PROVIDER_LOGO_BASE}${path}`
}

/** Best-effort region from the browser, falling back to US. */
function detectRegion(): string {
  try {
    const region = (navigator.language || 'en-US').split('-')[1]
    return region && region.length === 2 ? region.toUpperCase() : 'US'
  } catch {
    return 'US'
  }
}

interface RawProvider {
  provider_id: number
  provider_name: string
  logo_path?: string | null
}

interface RawRegionProviders {
  link?: string
  flatrate?: RawProvider[]
  free?: RawProvider[]
  ads?: RawProvider[]
  rent?: RawProvider[]
  buy?: RawProvider[]
}

function mapProviders(list?: RawProvider[]): WatchProvider[] {
  return (list ?? []).map((p) => ({
    provider_id: p.provider_id,
    provider_name: p.provider_name,
    logo_path: p.logo_path ?? null,
  }))
}

function dedupeProviders(list: WatchProvider[]): WatchProvider[] {
  const seen = new Set<number>()
  const out: WatchProvider[] = []
  for (const p of list) {
    if (seen.has(p.provider_id)) continue
    seen.add(p.provider_id)
    out.push(p)
  }
  return out
}

export async function fetchWatchProviders(
  movieId: number,
  region: string = detectRegion(),
): Promise<WatchProviders | null> {
  try {
    const res = await tmdbFetch(`/movie/${movieId}/watch/providers`)
    if (!res.ok) return null
    const data = (await res.json()) as { results?: Record<string, RawRegionProviders> }
    const results = data.results ?? {}
    const r = results[region] ?? results['US'] ?? null
    if (!r) return null

    // Treat free + ad-supported as "stream" alongside subscription services.
    const flatrate = dedupeProviders([
      ...mapProviders(r.flatrate),
      ...mapProviders(r.free),
      ...mapProviders(r.ads),
    ])
    const rent = dedupeProviders(mapProviders(r.rent))
    const buy = dedupeProviders(mapProviders(r.buy))

    if (flatrate.length === 0 && rent.length === 0 && buy.length === 0) return null
    return { link: r.link ?? null, flatrate, rent, buy }
  } catch {
    return null
  }
}

const TMDB_IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original'

export async function fetchCharacterBackdrop(
  filmTitle: string,
  year: number,
  actorName: string,
): Promise<string | null> {
  try {
    const params: TmdbParams = { query: filmTitle, include_adult: 'false' }
    if (year) params.year = year
    const res = await tmdbFetch('/search/movie', params)
    if (res.ok) {
      const data: TMDBSearchResponse = await res.json()
      const hit = data.results?.[0]
      if (hit?.backdrop_path) {
        return `${TMDB_IMG_ORIGINAL}${hit.backdrop_path}`
      }
    }
  } catch (err) {
    console.warn('[CASTED] backdrop film lookup failed', err)
  }

  if (!actorName) return null
  try {
    const res = await tmdbFetch('/search/person', {
      query: actorName,
      include_adult: 'false',
    })
    if (res.ok) {
      const data = await res.json()
      const person = data?.results?.[0]
      if (person?.profile_path) {
        return `${TMDB_IMG_ORIGINAL}${person.profile_path}`
      }
    }
  } catch (err) {
    console.warn('[CASTED] backdrop actor lookup failed', err)
  }

  return null
}

export function getYear(release_date?: string): string {
  if (!release_date) return ''
  return release_date.slice(0, 4)
}

export const BROWSE_GENRES = [
  'Action',
  'Drama',
  'Comedy',
  'Horror',
  'Sci-Fi',
  'Fantasy',
  'Mystery',
  'Romance',
  'Thriller',
] as const

export const BROWSE_ERAS = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', 'Now'] as const

export const BROWSE_COUNTRIES = [
  'American',
  'French',
  'Korean',
  'Japanese',
  'Italian',
  'Latin American',
] as const

export const BROWSE_RUNTIMES = ['Under 90 min', '90–120 min', '120+ min'] as const

export const BROWSE_MIN_RATINGS = [7, 8, 9] as const

const TMDB_GENRE_IDS: Record<string, number> = {
  Action: 28,
  Drama: 18,
  Comedy: 35,
  Horror: 27,
  'Sci-Fi': 878,
  Fantasy: 14,
  Mystery: 9648,
  Romance: 10749,
  Thriller: 53,
}

const COUNTRY_LANGUAGE: Record<string, string> = {
  American: 'en',
  French: 'fr',
  Korean: 'ko',
  Japanese: 'ja',
  Italian: 'it',
  'Latin American': 'es',
}

const ERA_RANGES: Record<string, [string, string]> = {
  '1960s': ['1960-01-01', '1969-12-31'],
  '1970s': ['1970-01-01', '1979-12-31'],
  '1980s': ['1980-01-01', '1989-12-31'],
  '1990s': ['1990-01-01', '1999-12-31'],
  '2000s': ['2000-01-01', '2009-12-31'],
  '2010s': ['2010-01-01', '2019-12-31'],
  Now: ['2020-01-01', '2099-12-31'],
}

const RUNTIME_RANGES: Record<string, [number | null, number | null]> = {
  'Under 90 min': [null, 89],
  '90–120 min': [90, 120],
  '120+ min': [121, null],
}

export interface BrowseFilters {
  genre: string | null
  era: string | null
  country: string | null
  runtime: string | null
  minRating: number | null
}

export interface DiscoverOptions extends BrowseFilters {
  hiddenGems: boolean
  page: number
}

export async function discoverMovies(opts: DiscoverOptions): Promise<TMDBMovie[]> {
  const params: TmdbParams = {
    include_adult: 'false',
    page: opts.page,
    sort_by: 'popularity.desc',
    without_genres: '99,10402',
  }

  if (opts.genre && TMDB_GENRE_IDS[opts.genre]) {
    params.with_genres = TMDB_GENRE_IDS[opts.genre]
  }
  if (opts.country && COUNTRY_LANGUAGE[opts.country]) {
    params.with_original_language = COUNTRY_LANGUAGE[opts.country]
  }
  if (opts.era && ERA_RANGES[opts.era]) {
    const [gte, lte] = ERA_RANGES[opts.era]
    params['primary_release_date.gte'] = gte
    params['primary_release_date.lte'] = lte
  }
  if (opts.runtime && RUNTIME_RANGES[opts.runtime]) {
    const [gte, lte] = RUNTIME_RANGES[opts.runtime]
    if (gte != null) params['with_runtime.gte'] = gte
    if (lte != null) params['with_runtime.lte'] = lte
  }

  if (opts.hiddenGems) {
    params['vote_count.gte'] = '60'
    params['vote_count.lte'] = '100000'
    params['vote_average.gte'] = opts.minRating ?? 7.5
  } else {
    params['vote_count.gte'] = '100000'
    params['vote_average.gte'] = opts.minRating ?? 7
  }

  const res = await tmdbFetch('/discover/movie', params)
  if (!res.ok) throw new Error(`TMDB discover failed ${res.status}`)
  const data: TMDBSearchResponse = await res.json()
  return data.results ?? []
}

export function castedScore(movie: { vote_average?: number; vote_count?: number }): number {
  const va = movie.vote_average ?? 0
  const vc = Math.max(movie.vote_count ?? 2, 2)
  const score = va * 10 + (1 / Math.log(vc)) * 20
  return Math.round(score)
}

export function getDirector(
  details: TMDBMovieDetails | null,
): { id: number; name: string } | null {
  if (!details?.credits?.crew) return null
  const d = details.credits.crew.find((c) => c.job === 'Director')
  if (!d) return null
  return { id: d.id, name: d.name }
}

interface PersonMovieCreditsResponse {
  crew?: Array<TMDBMovie & { job?: string; department?: string }>
}

export interface PremiumPick {
  date: string
  movie: TMDBMovie
  details: TMDBMovieDetails | null
}

const PREMIUM_PICK_KEY = 'casted_premium_pick_v3'

function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface TMDBImage {
  file_path: string
  width: number
  height: number
  iso_639_1: string | null
  vote_average: number
  vote_count: number
}

interface TMDBImagesResponse {
  backdrops?: TMDBImage[]
}

export async function fetchBestBackdrop(
  movieId: number,
  fallback: string | null,
): Promise<string | null> {
  try {
    const res = await tmdbFetch(`/movie/${movieId}/images`, {
      include_image_language: 'en,null',
    })
    if (!res.ok) return fallback
    const data = (await res.json()) as TMDBImagesResponse
    const backdrops = data.backdrops ?? []
    if (backdrops.length === 0) return fallback

    // The TMDB community upvotes the most striking key visuals — trust that.
    // Quality floor: HD width + at least 1 vote so we're not picking junk uploads.
    const voted = backdrops.filter((b) => b.vote_count > 0 && b.width >= 1280)
    const pool = voted.length > 0 ? voted : backdrops

    const ranked = [...pool].sort((a, b) => {
      // 1. Community rating — strongest signal of "this image sells the movie"
      if (b.vote_average !== a.vote_average) return b.vote_average - a.vote_average
      // 2. More votes = more validated
      if (b.vote_count !== a.vote_count) return b.vote_count - a.vote_count
      // 3. Prefer no-text only as a tiebreak (text-on-backdrop is rare anyway)
      const aText = a.iso_639_1 === null ? 0 : 1
      const bText = b.iso_639_1 === null ? 0 : 1
      if (aText !== bText) return aText - bText
      // 4. Bigger = sharper
      return b.width * b.height - a.width * a.height
    })

    const best = ranked[0]

    return best.file_path
  } catch (err) {
    console.warn('[CASTED] 👑 fetchBestBackdrop failed', err)
    return fallback
  }
}

async function fetchTopRatedPage(page: number): Promise<TMDBMovie[]> {
  const res = await tmdbFetch('/movie/top_rated', { page })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[CASTED] ❌ Premium Pick top_rated failed', res.status, body)
    throw new Error(`Premium Pick top_rated failed ${res.status}: ${body || res.statusText}`)
  }
  const data: TMDBSearchResponse = await res.json()
  const results = data.results ?? []

  return results
}

export async function fetchPremiumPick(): Promise<PremiumPick> {
  const today = todayKey()

  try {
    const raw = localStorage.getItem(PREMIUM_PICK_KEY)
    if (raw) {
      const cached = JSON.parse(raw) as PremiumPick
      if (cached.date === today && cached.movie?.id && cached.movie?.backdrop_path) {

        return cached
      }
      if (cached.date === today) {
        console.warn('[CASTED] 👑 Cached pick missing backdrop_path — refetching')
      }
    }
  } catch (err) {
    console.warn('[CASTED] 👑 Premium Pick cache read failed', err)
  }

  const seed = parseInt(today.replace(/-/g, ''), 10)
  // top_rated is sorted highest first. Pick within the first 5 pages (~100 films)
  // so the daily rotation always lands on a film in the absolute top tier.
  const TOP_PAGES = 5
  const startPage = (seed % TOP_PAGES) + 1

  let chosen: TMDBMovie | null = null
  let attempts = 0
  for (let i = 0; i < TOP_PAGES && !chosen; i++) {
    const page = ((startPage - 1 + i) % TOP_PAGES) + 1
    attempts++
    const results = await fetchTopRatedPage(page)
    const candidates = results.filter((m) => m.backdrop_path && m.poster_path)
    if (candidates.length === 0) {
      console.warn(
        `[CASTED] 👑 No backdrop+poster candidates on page ${page}, trying next…`,
      )
      continue
    }
    chosen = candidates[seed % candidates.length]
    if (!chosen.backdrop_path) {
      chosen = candidates.find((c) => c.backdrop_path) ?? null
    }
  }

  if (!chosen) {
    throw new Error(`Premium Pick: no candidates after ${attempts} pages`)
  }

  const [details, bestBackdrop] = await Promise.all([
    fetchMovieDetails(chosen.id),
    fetchBestBackdrop(chosen.id, chosen.backdrop_path ?? null),
  ])

  if (bestBackdrop && bestBackdrop !== chosen.backdrop_path) {

    chosen = { ...chosen, backdrop_path: bestBackdrop }
  }

  const payload: PremiumPick = { date: today, movie: chosen, details }
  try {
    localStorage.setItem(PREMIUM_PICK_KEY, JSON.stringify(payload))
  } catch (err) {
    console.warn('[CASTED] 👑 Premium Pick cache write failed', err)
  }
  return payload
}

export async function fetchDirectorFilms(
  personId: number,
  excludeId?: number,
): Promise<TMDBMovie[]> {
  const res = await tmdbFetch(`/person/${personId}/movie_credits`)
  if (!res.ok) return []
  const data = (await res.json()) as PersonMovieCreditsResponse
  const crew = data.crew ?? []
  return crew
    .filter((c) => c.job === 'Director' && c.poster_path && c.id !== excludeId)
    .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
    .slice(0, 8)
}
