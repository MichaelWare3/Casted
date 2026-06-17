// Edge proxy for Unsplash — keeps UNSPLASH_ACCESS_KEY server-side.
// Client calls /api/unsplash?query=...
export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server missing UNSPLASH_ACCESS_KEY' }), { status: 500 })
  }

  const url = new URL(req.url)
  const query = url.searchParams.get('query') ?? ''
  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400 })
  }

  const target = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query,
  )}&per_page=1&orientation=landscape&content_filter=high`

  const upstream = await fetch(target, {
    headers: { Authorization: `Client-ID ${apiKey}` },
  })
  const text = await upstream.text()
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
