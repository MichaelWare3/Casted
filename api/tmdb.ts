// Edge proxy for TMDB — a single flat function (reliable on Vercel for any
// framework). The client sends the TMDB path as a "path" query param plus any
// other params; we inject TMDB_API_KEY server-side and forward the request.
// e.g. /api/tmdb?path=/movie/top_rated&page=2
export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server missing TMDB_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const path = url.searchParams.get('path') ?? ''
  if (!path) {
    return new Response(JSON.stringify({ error: 'Missing path' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const params = new URLSearchParams(url.search)
  params.delete('path')
  params.set('api_key', apiKey)

  const cleanPath = path.replace(/^\/+/, '')
  const target = `https://api.themoviedb.org/3/${cleanPath}?${params.toString()}`

  const upstream = await fetch(target, { headers: { Accept: 'application/json' } })
  const text = await upstream.text()
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
