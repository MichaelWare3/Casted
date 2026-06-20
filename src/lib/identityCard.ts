export type CardFormat = 'story' | 'square'

export const IDENTITY_CARD_SIZES: Record<CardFormat, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
}

const GOLD = '#B8952A'
const CREAM = '#F2ECD8'

export interface IdentityCardData {
  line: string
  traits: string[]
  characters: string[]
  lovedTitles: string[]
  stats: { films: number; watched: number; cast: number }
}

function hexToRgba(hex: string, a: number): string {
  const m = hex.replace('#', '')
  return `rgba(${parseInt(m.slice(0, 2), 16)}, ${parseInt(m.slice(2, 4), 16)}, ${parseInt(m.slice(4, 6), 16)}, ${a})`
}

async function ensureFonts() {
  try {
    if (!document.fonts) return
    await Promise.all([
      document.fonts.load('italic 700 110px "Playfair Display"'),
      document.fonts.load('italic 400 36px "Playfair Display"'),
      document.fonts.load('600 24px "Inter"'),
    ])
    await document.fonts.ready
  } catch {
    /* fall back to system fonts */
  }
}

function setLS(ctx: CanvasRenderingContext2D, px: number) {
  try {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px}px`
  } catch {
    /* ignore */
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line)
      line = w
    } else line = t
  }
  if (line) lines.push(line)
  return lines
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const tile = document.createElement('canvas')
  tile.width = 128
  tile.height = 128
  const tctx = tile.getContext('2d')
  if (!tctx) return
  const img = tctx.createImageData(128, 128)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  tctx.putImageData(img, 0, 0)
  const pat = ctx.createPattern(tile, 'repeat')
  if (!pat) return
  ctx.save()
  ctx.globalAlpha = 0.035
  ctx.fillStyle = pat
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

export async function renderIdentityCard(
  canvas: HTMLCanvasElement,
  data: IdentityCardData,
  format: CardFormat,
): Promise<void> {
  const { w, h } = IDENTITY_CARD_SIZES[format]
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  await ensureFonts()

  const cx = w / 2
  const maxW = w * 0.84

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#16161c')
  bg.addColorStop(0.55, '#0d0d10')
  bg.addColorStop(1, '#0A0A0B')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(cx, h * 0.32, 0, cx, h * 0.32, w * 0.72)
  glow.addColorStop(0, hexToRgba(GOLD, 0.22))
  glow.addColorStop(0.5, hexToRgba(GOLD, 0.06))
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  const vig = ctx.createRadialGradient(cx, h / 2, h * 0.2, cx, h / 2, h * 0.72)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
  grain(ctx, w, h)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  let y = h * (format === 'story' ? 0.2 : 0.15)

  // Eyebrow
  ctx.fillStyle = GOLD
  ctx.font = '600 26px "Inter", sans-serif'
  setLS(ctx, 10)
  ctx.fillText('MY CINEMA', cx, y)
  setLS(ctx, 0)

  // Identity line
  y += format === 'story' ? 120 : 96
  ctx.fillStyle = CREAM
  let size = format === 'story' ? 86 : 72
  let lines: string[] = []
  for (; size >= 44; size -= 4) {
    ctx.font = `italic 700 ${size}px "Playfair Display", Georgia, serif`
    lines = wrap(ctx, data.line, maxW)
    if (lines.length <= 3) break
  }
  ctx.font = `italic 700 ${size}px "Playfair Display", Georgia, serif`
  const lh = size * 1.12
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lh))
  y += (lines.length - 1) * lh

  // Divider
  y += format === 'story' ? 86 : 64
  ctx.fillStyle = GOLD
  ctx.fillRect(cx - 60, y, 120, 3)

  const block = (label: string, value: string, valColor: string) => {
    y += format === 'story' ? 78 : 64
    ctx.fillStyle = hexToRgba(GOLD, 0.85)
    ctx.font = '600 20px "Inter", sans-serif'
    setLS(ctx, 6)
    ctx.fillText(label, cx, y)
    setLS(ctx, 0)
    y += 44
    ctx.fillStyle = valColor
    ctx.font = 'italic 400 36px "Playfair Display", Georgia, serif'
    const vl = wrap(ctx, value, maxW)
    vl.forEach((l, i) => ctx.fillText(l, cx, y + i * 46))
    y += (vl.length - 1) * 46
  }

  if (data.characters.length) block('CAST AS', data.characters.join('   ·   '), CREAM)
  if (data.lovedTitles.length) block('LOVED', data.lovedTitles.join('   ·   '), hexToRgba(CREAM, 0.78))

  if (data.traits.length) {
    y += format === 'story' ? 70 : 56
    ctx.fillStyle = hexToRgba(GOLD, 0.95)
    ctx.font = '500 24px "Inter", sans-serif'
    setLS(ctx, 5)
    const traitsLine = data.traits.slice(0, 6).map((t) => t.toUpperCase()).join('   ·   ')
    const tl = wrap(ctx, traitsLine, maxW)
    tl.forEach((l, i) => ctx.fillText(l, cx, y + i * 36))
    y += (tl.length - 1) * 36
    setLS(ctx, 0)
  }

  // Stats
  y += format === 'story' ? 80 : 60
  ctx.fillStyle = hexToRgba(CREAM, 0.6)
  ctx.font = '400 24px "Inter", sans-serif'
  setLS(ctx, 2)
  ctx.fillText(
    `${data.stats.films} films  ·  ${data.stats.watched} watched  ·  cast ${data.stats.cast}×`,
    cx,
    y,
  )
  setLS(ctx, 0)

  // Footer
  const fy = h * (format === 'story' ? 0.92 : 0.93)
  ctx.fillStyle = GOLD
  ctx.font = 'italic 700 40px "Playfair Display", Georgia, serif'
  setLS(ctx, 10)
  ctx.fillText('CASTED', cx, fy)
  setLS(ctx, 0)
  ctx.fillStyle = hexToRgba(CREAM, 0.5)
  ctx.font = '400 23px "Inter", sans-serif'
  setLS(ctx, 2)
  ctx.fillText('Find yourself in film.', cx, fy + 42)
  setLS(ctx, 0)
}

export function identityCardFilename(format: CardFormat): string {
  return `casted-my-cinema-${format}.png`
}
