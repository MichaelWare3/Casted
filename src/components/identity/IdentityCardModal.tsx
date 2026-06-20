import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Share2, X } from 'lucide-react'
import LoadingDots from '../shared/LoadingDots'
import { canvasToBlob } from '../../lib/shareCard'
import {
  renderIdentityCard,
  identityCardFilename,
  type CardFormat,
  type IdentityCardData,
} from '../../lib/identityCard'

interface IdentityCardModalProps {
  data: IdentityCardData
  onClose: () => void
}

export default function IdentityCardModal({ data, onClose }: IdentityCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [format, setFormat] = useState<CardFormat>('square')
  const [rendering, setRendering] = useState(true)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean }
    setCanShare(typeof nav.canShare === 'function' && typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    let cancelled = false
    setRendering(true)
    const canvas = canvasRef.current
    if (!canvas) return
    renderIdentityCard(canvas, data, format)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRendering(false)
      })
    return () => {
      cancelled = true
    }
  }, [data, format])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function getBlob(): Promise<Blob | null> {
    return canvasRef.current ? canvasToBlob(canvasRef.current) : null
  }

  async function handleDownload() {
    const blob = await getBlob()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = identityCardFilename(format)
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    const blob = await getBlob()
    if (!blob) return
    const file = new File([blob], identityCardFilename(format), { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean }
    try {
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: 'My Cinema — CASTED' })
        return
      }
    } catch {
      /* fall through to download */
    }
    await handleDownload()
  }

  const previewMaxH = format === 'story' ? '64vh' : '54vh'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto px-4 py-8"
      style={{ background: 'rgba(10,10,11,0.97)' }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="fixed right-6 top-6 z-[130] flex h-10 w-10 items-center justify-center text-casted-cream transition-colors hover:text-casted-gold"
      >
        <X size={22} strokeWidth={1.5} />
      </button>

      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col items-center"
      >
        <p
          className="font-body text-[10px] uppercase tracking-[0.4em]"
          style={{ color: '#B8952A', marginBottom: '20px' }}
        >
          Your Cinema Card
        </p>

        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ border: '1px solid rgba(184,149,42,0.2)', background: '#0A0A0B', minHeight: '220px' }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              maxHeight: previewMaxH,
              maxWidth: '100%',
              height: 'auto',
              width: 'auto',
              opacity: rendering ? 0.25 : 1,
              transition: 'opacity 0.3s ease',
            }}
          />
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingDots />
            </div>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Card format"
          className="mt-6 inline-flex items-center gap-1 rounded-full border border-casted-cream/10 bg-casted-black/70 px-1.5 py-1"
        >
          {(['square', 'story'] as CardFormat[]).map((f) => {
            const selected = format === f
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFormat(f)}
                className="rounded-full font-body uppercase transition-colors"
                style={{
                  padding: '6px 16px',
                  fontSize: '10px',
                  letterSpacing: '0.25em',
                  background: selected ? '#B8952A' : 'transparent',
                  color: selected ? '#0A0A0B' : 'rgba(242,236,216,0.55)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {f === 'story' ? 'Story' : 'Square'}
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center" style={{ gap: '12px' }}>
          {canShare && (
            <button
              type="button"
              onClick={handleShare}
              disabled={rendering}
              className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-widest text-casted-black transition-all disabled:opacity-40"
              style={{ padding: '12px 28px', background: '#B8952A', border: '1px solid #B8952A', cursor: 'pointer' }}
            >
              <Share2 size={13} strokeWidth={2} />
              Share
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={rendering}
            className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-widest transition-all disabled:opacity-40"
            style={{
              padding: '12px 28px',
              background: canShare ? 'transparent' : '#B8952A',
              border: '1px solid #B8952A',
              color: canShare ? '#B8952A' : '#0A0A0B',
              cursor: 'pointer',
            }}
          >
            <Download size={13} strokeWidth={2} />
            Download
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
