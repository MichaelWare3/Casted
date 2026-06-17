// Edge proxy for TMDB — catch-all that forwards /api/tmdb/<anything> to
// api.themoviedb.org/3/<anything>, injecting TMDB_API_KEY server-side so it
// never ships to the browser.
export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server missing TMDB_API_KEY' }), { status: 500 })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/api\/tmdb\/?/, '')
  if (!path) {
    return new Response(JSON.stringify({ error: 'Missing TMDB path' }), { status: 400 })
  }

  const params = new URLSearchParams(url.search)
  params.set('api_key', apiKey)

  const target = `https://api.themoviedb.org/3/${path}?${params.toString()}`
  const upstream = await fetch(target, { headers: { Accept: 'application/json' } })
  const text = await upstream.text()
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
