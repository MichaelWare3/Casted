const UNSPLASH_SEARCH = 'https://api.unsplash.com/search/photos'
const CACHE_PREFIX = 'casted:unsplash:'

function getKey(): string {
  const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
  if (!key) throw new Error('Missing VITE_UNSPLASH_ACCESS_KEY')
  return key
}

interface UnsplashPhoto {
  urls: { regular: string; small: string }
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[]
}

function readCache(query: string): string | null {
  try {
    return localStorage.getItem(CACHE_PREFIX + query)
  } catch {
    return null
  }
}

function writeCache(query: string, url: string): void {
  try {
    localStorage.setItem(CACHE_PREFIX + query, url)
  } catch {
    // localStorage full or unavailable — ignore
  }
}

const USE_UNSPLASH_DIRECT =
  import.meta.env.DEV && !!import.meta.env.VITE_UNSPLASH_ACCESS_KEY

export async function fetchGenreBackground(query: string): Promise<string> {
  const cached = readCache(query)
  if (cached) return cached

  const res = USE_UNSPLASH_DIRECT
    ? await fetch(
        `${UNSPLASH_SEARCH}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&content_filter=high`,
        { headers: { Authorization: `Client-ID ${getKey()}` } },
      )
    : await fetch(`/api/unsplash?query=${encodeURIComponent(query)}`)
  if (!res.ok) {
    throw new Error(`Unsplash search failed ${res.status}`)
  }
  const data = (await res.json()) as UnsplashSearchResponse
  const hit = data.results?.[0]?.urls?.regular
  if (!hit) throw new Error(`No Unsplash result for "${query}"`)
  writeCache(query, hit)
  return hit
}
