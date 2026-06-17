import type { AlterEgoCharacter } from '../types'

export type CardFormat = 'story' | 'square'

export const CARD_SIZES: Record<CardFormat, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
}

const CREAM = '#F2ECD8'
const BRAND_GOLD = '#B8952A'

/** Derive an accent colour from the character's vibe so the card matches them. */
export function vibeAccent(character: AlterEgoCharacter): string {
  const text = [
    (character.vibe_tags ?? []).join(' '),
    character.description ?? '',
    character.character_name ?? '',
  ]
    .join(' ')
    .toLowerCase()

  const groups: { keys: string[]; accent: string }[] = [
    { keys: ['menac', 'danger', 'lethal', 'terr', 'kill', 'villain', 'blood', 'vengeance', 'brutal', 'psycho', 'sinister'], accent: '#C0392B' }, // crimson
    { keys: ['chaos', 'wild', 'unpredict', 'manic', 'reckless', 'rebel', 'anarch'], accent: '#D2691E' }, // burnt orange
    { keys: ['cool', 'calm', 'cold', 'stoic', 'quiet', 'noir', 'night', 'collect', 'detach', 'still'], accent: '#6FA8C7' }, // steel blue
    { keys: ['romance', 'romantic', 'love', 'dream', 'whimsy', 'whimsical', 'tender', 'warm', 'heart', 'magnetic', 'free spirit'], accent: '#D98C6A' }, // warm rose
    { keys: ['genius', 'intellect', 'outsider', 'strange', 'myster', 'clever', 'enigmat', 'eccentric'], accent: '#9A7BC0' }, // violet
    { keys: ['warrior', 'fearless', 'ambition', 'hunger', 'fierce', 'power', 'survivor', 'relentless'], accent: '#C98A2B' }, // ember
  ]

  for (const g of groups) {
    if (g.keys.some((k) => text.includes(k))) return g.accent
  }
  return BRAND_GOLD
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    let settled = false
    const finish = (val: HTMLImageElement | null) => {
      if (!settled) {
        settled = true
        resolve(val)
      }
    }
    img.onload = () => finish(img)
    img.onerror = () => finish(null)
    img.src = url
    window.setTimeout(() => finish(null), 6000)
  })
}

async function ensureFonts() {
  try {
    if (!document.fonts) return
    await Promise.all([
      document.fonts.load('italic 700 150px "Playfair Display"'),
      document.fonts.load('italic 400 40px "Playfair Display"'),
      document.fonts.load('600 26px "Inter"'),
      document.fonts.load('500 24px "Inter"'),
    ])
    await document.fonts.ready
  } catch {
    /* fonts may already be ready or unavailable — draw with fallbacks */
  }
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  try {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px}px`
  } catch {
    /* not supported — ignore */
  }
}

function wrapWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawGrain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const tile = document.createElement('canvas')
  tile.width = 128
  tile.height = 128
  const tctx = tile.getContext('2d')
  if (!tctx) return
  const imgData = tctx.createImageData(128, 128)
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.random() * 255
    imgData.data[i] = v
    imgData.data[i + 1] = v
    imgData.data[i + 2] = v
    imgData.data[i + 3] = 255
  }
  tctx.putImageData(imgData, 0, 0)
  const pattern = ctx.createPattern(tile, 'repeat')
  if (!pattern) return
  ctx.save()
  ctx.globalAlpha = 0.035
  ctx.fillStyle = pattern
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

export interface RenderCardOptions {
  character: AlterEgoCharacter
  backdropUrl: string | null
  format: CardFormat
}

/** Draws the shareable Alter Ego card onto `canvas` at full resolution. */
export async function renderEgoCard(
  canvas: HTMLCanvasElement,
  { character, backdropUrl, format }: RenderCardOptions,
): Promise<void> {
  const { w, h } = CARD_SIZES[format]
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  await ensureFonts()

  const accent = vibeAccent(character)
  const cx = w / 2

  // Base
  ctx.fillStyle = '#0A0A0B'
  ctx.fillRect(0, 0, w, h)

  // Backdrop (cinematic) with graceful fallback to dark gradient
  const img = backdropUrl ? await loadImage(backdropUrl) : null
  if (img && img.width > 0) {
    const scale = Math.max(w / img.width, h / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    ctx.save()
    ctx.filter = 'grayscale(35%) brightness(0.42) contrast(1.15)'
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
    ctx.restore()
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#16161c')
    grad.addColorStop(0.55, '#0d0d10')
    grad.addColorStop(1, '#0A0A0B')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  // Accent glow (upper-center)
  const glow = ctx.createRadialGradient(cx, h * 0.34, 0, cx, h * 0.34, w * 0.7)
  glow.addColorStop(0, hexToRgba(accent, 0.28))
  glow.addColorStop(0.5, hexToRgba(accent, 0.08))
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // Darken top + bottom for text legibility
  const veil = ctx.createLinearGradient(0, 0, 0, h)
  veil.addColorStop(0, 'rgba(10,10,11,0.55)')
  veil.addColorStop(0.45, 'rgba(10,10,11,0.15)')
  veil.addColorStop(0.78, 'rgba(10,10,11,0.65)')
  veil.addColorStop(1, 'rgba(10,10,11,0.96)')
  ctx.fillStyle = veil
  ctx.fillRect(0, 0, w, h)

  // Vignette
  const vig = ctx.createRadialGradient(cx, h / 2, h * 0.2, cx, h / 2, h * 0.72)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)

  drawGrain(ctx, w, h)

  // ── Text ───────────────────────────────────────────────────────────────────
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const maxTextWidth = w * 0.84

  let y = h * (format === 'story' ? 0.32 : 0.27)

  // Eyebrow
  ctx.fillStyle = hexToRgba(CREAM, 0.7)
  ctx.font = '600 26px "Inter", system-ui, sans-serif'
  setLetterSpacing(ctx, 9)
  ctx.fillText('TONIGHT YOU ARE', cx, y)
  setLetterSpacing(ctx, 0)

  // Name (auto-fit to <= 2 lines)
  const name = (character.character_name || 'Unknown').toUpperCase()
  const startSize = format === 'story' ? 150 : 132
  let nameSize = startSize
  let nameLines: string[] = [name]
  for (let size = startSize; size >= 64; size -= 4) {
    ctx.font = `italic 700 ${size}px "Playfair Display", Georgia, serif`
    const lines = wrapWords(ctx, name, maxTextWidth)
    if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= maxTextWidth)) {
      nameSize = size
      nameLines = lines
      break
    }
    nameSize = size
    nameLines = lines.slice(0, 2)
  }

  y += format === 'story' ? 96 : 84
  ctx.fillStyle = CREAM
  ctx.font = `italic 700 ${nameSize}px "Playfair Display", Georgia, serif`
  const nameLineHeight = nameSize * 1.0
  nameLines.forEach((line, i) => {
    ctx.fillText(line, cx, y + i * nameLineHeight)
  })
  y += (nameLines.length - 1) * nameLineHeight

  // Divider
  y += 54
  ctx.fillStyle = accent
  ctx.fillRect(cx - 65, y, 130, 3)

  // Film · year
  y += 66
  ctx.fillStyle = accent
  ctx.font = 'italic 400 40px "Playfair Display", Georgia, serif'
  const filmLine = character.year
    ? `${character.film_of_origin} · ${character.year}`
    : character.film_of_origin
  ctx.fillText(filmLine || '', cx, y)

  // Vibe tags
  const tags = (character.vibe_tags ?? []).filter(Boolean).map((t) => t.toUpperCase())
  if (tags.length > 0) {
    y += 62
    let tagSize = 24
    let joined = tags.join('   ·   ')
    ctx.font = `500 ${tagSize}px "Inter", system-ui, sans-serif`
    setLetterSpacing(ctx, 4)
    if (ctx.measureText(joined).width > maxTextWidth) {
      tagSize = 20
      ctx.font = `500 ${tagSize}px "Inter", system-ui, sans-serif`
    }
    ctx.fillStyle = hexToRgba(accent, 0.92)
    if (ctx.measureText(joined).width > maxTextWidth && tags.length > 3) {
      // split into two lines
      const half = Math.ceil(tags.length / 2)
      const l1 = tags.slice(0, half).join('   ·   ')
      const l2 = tags.slice(half).join('   ·   ')
      ctx.fillText(l1, cx, y)
      ctx.fillText(l2, cx, y + tagSize * 1.6)
    } else {
      ctx.fillText(joined, cx, y)
    }
    setLetterSpacing(ctx, 0)
    void joined
  }

  // ── Footer brand ─────────────────────────────────────────────────────────
  const footY = h * (format === 'story' ? 0.9 : 0.92)
  ctx.fillStyle = BRAND_GOLD
  ctx.font = 'italic 700 40px "Playfair Display", Georgia, serif'
  setLetterSpacing(ctx, 10)
  ctx.fillText('CASTED', cx, footY)
  setLetterSpacing(ctx, 0)

  ctx.fillStyle = hexToRgba(CREAM, 0.5)
  ctx.font = '400 23px "Inter", system-ui, sans-serif'
  setLetterSpacing(ctx, 2)
  ctx.fillText('Find yourself in film.', cx, footY + 42)
  setLetterSpacing(ctx, 0)
}

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function cardFilename(character: AlterEgoCharacter, format: CardFormat): string {
  const slug = (character.character_name || 'casted')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `casted-${slug || 'character'}-${format}.png`
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95)
  })
}
