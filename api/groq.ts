// Edge proxy for Groq — keeps GROQ_API_KEY server-side. The client posts the
// same OpenAI-compatible body it would have sent to Groq directly; we forward
// it with the secret key and return Groq's response verbatim (status included,
// so the client's rate-limit fallback still works).
export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server missing GROQ_API_KEY' }), { status: 500 })
  }

  let body: string
  try {
    body = JSON.stringify(await req.json())
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  })

  const text = await upstream.text()
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
