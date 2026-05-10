'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, ExternalLink, Loader2, RefreshCw } from 'lucide-react'

interface Props {
  url: string
  title: string
}

/**
 * Coba ekstrak embed URL langsung dari URL panjang (tanpa API call).
 * Hanya berhasil jika URL mengandung koordinat secara eksplisit.
 */
function getEmbedUrlDirect(mapsUrl: string): string | null {
  if (!mapsUrl) return null
  try {
    // @lat,lng
    const atCoords = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (atCoords) {
      return `https://maps.google.com/maps?q=${atCoords[1]},${atCoords[2]}&output=embed&hl=id&z=16`
    }
    // !3dLAT!4dLNG
    const dataCoords = mapsUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (dataCoords) {
      return `https://maps.google.com/maps?q=${dataCoords[1]},${dataCoords[2]}&output=embed&hl=id&z=16`
    }
    const parsed = new URL(mapsUrl)
    const q = parsed.searchParams.get('q')
    if (q) return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&hl=id`
    const query = parsed.searchParams.get('query')
    if (query) return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed&hl=id`
    const ll = parsed.searchParams.get('ll')
    if (ll) return `https://maps.google.com/maps?q=${encodeURIComponent(ll)}&output=embed&hl=id`
  } catch {
    // URL tidak valid
  }
  return null
}

export default function MapEmbed({ url, title }: Props) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const resolve = useCallback(async () => {
    if (!url) {
      setLoading(false)
      setError(true)
      return
    }

    setLoading(true)
    setError(false)

    // ── Coba langsung dulu (URL panjang tanpa API call) ──────────────────
    const direct = getEmbedUrlDirect(url)
    if (direct) {
      setEmbedUrl(direct)
      setLoading(false)
      return
    }

    // ── Short URL (goo.gl) → resolve via server-side API ─────────────────
    try {
      const res = await fetch(`/api/resolve-maps?url=${encodeURIComponent(url)}`)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data: { embedUrl?: string | null; success: boolean; error?: string } = await res.json()

      if (data.success && data.embedUrl) {
        setEmbedUrl(data.embedUrl)
        setLoading(false)
      } else {
        setError(true)
        setLoading(false)
      }
    } catch {
      setError(true)
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    resolve()
  }, [resolve])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="rounded-xl border border-slate-200 flex items-center justify-center gap-2"
        style={{ height: '360px', background: '#f8fafc' }}
      >
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#009345' }} />
        <span className="text-sm text-slate-400">Memuat peta...</span>
      </div>
    )
  }

  // ── Gagal / tidak bisa di-embed ──────────────────────────────────────────
  if (error || !embedUrl) {
    return (
      <div
        className="rounded-xl border border-slate-200 flex items-center justify-between gap-3 p-4"
        style={{ height: '360px', background: '#f8fafc' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <MapPin className="w-5 h-5 text-slate-300 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-1">Tidak dapat menampilkan peta.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: '#009345' }}
            >
              Buka di Google Maps
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
        </div>
        <button
          onClick={resolve}
          title="Coba lagi"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // ── Berhasil ─────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: '360px' }}>
      <iframe
        src={embedUrl}
        width="100%"
        height="360"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={title}
      />
    </div>
  )
}
