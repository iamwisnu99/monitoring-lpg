import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Ekstrak embed URL dari berbagai pola URL Google Maps
 */
function extractEmbedUrl(url: string): string | null {
  if (!url) return null
  try {
    // ── @lat,lng (URL panjang biasa) ────────────────────────────────────
    const atCoords = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (atCoords) {
      return `https://maps.google.com/maps?q=${atCoords[1]},${atCoords[2]}&output=embed&hl=id&z=16`
    }

    // ── !3dLAT!4dLNG (format data URL Google Maps) ──────────────────────
    // Contoh: ...data=!3m1!...!3d-6.123!4d106.456...
    const dataCoords = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (dataCoords) {
      return `https://maps.google.com/maps?q=${dataCoords[1]},${dataCoords[2]}&output=embed&hl=id&z=16`
    }

    const parsed = new URL(url)
    const q = parsed.searchParams.get('q')
    if (q) return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&hl=id`
    const query = parsed.searchParams.get('query')
    if (query) return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed&hl=id`
    const ll = parsed.searchParams.get('ll')
    if (ll) return `https://maps.google.com/maps?q=${encodeURIComponent(ll)}&output=embed&hl=id`
  } catch {
    // invalid URL, skip
  }
  return null
}

/**
 * Ekstrak koordinat dari konten HTML Google Maps
 */
function extractFromHtml(html: string): string | null {
  // Pattern dari JSON di dalam HTML
  const patterns = [
    // "latitude":-6.1234,"longitude":106.7890
    html.match(/"latitude":(-?\d+\.\d+),"longitude":(-?\d+\.\d+)/),
    // [null,null,-6.1234,106.7890]
    html.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/),
    // center=-6.1234,106.7890
    html.match(/center=(-?\d+\.\d+),(-?\d+\.\d+)/),
  ]

  for (const match of patterns) {
    if (match) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      // Sanity check: koordinat Indonesia / Asia Tenggara
      if (lat >= -15 && lat <= 10 && lng >= 95 && lng <= 145) {
        return `https://maps.google.com/maps?q=${lat},${lng}&output=embed&hl=id&z=16`
      }
    }
  }
  return null
}

/**
 * GET /api/resolve-maps?url=<encoded_maps_url>
 *
 * Resolve URL pendek Google Maps server-side dengan multi-strategy:
 * 1. Follow redirect → extract @lat,lng dari final URL
 * 2. Follow redirect → extract !3d..!4d.. dari data URL
 * 3. Parse HTML response → extract koordinat dari JSON di dalam halaman
 */
export async function GET(request: NextRequest) {
  const mapsUrl = request.nextUrl.searchParams.get('url')

  if (!mapsUrl) {
    return Response.json({ error: 'Parameter url wajib diisi', success: false }, { status: 400 })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12000)

  try {
    // Gunakan mobile User-Agent agar Google mengembalikan URL dengan koordinat
    const response = await fetch(mapsUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Mobile browser UA — Google biasanya lebih terbuka dengan redirect ke URL koordinat
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    })
    clearTimeout(timeoutId)

    const finalUrl = response.url

    // Strategy 1: ekstrak langsung dari final URL
    let embedUrl = extractEmbedUrl(finalUrl)

    // Strategy 2: parse HTML jika URL tidak mengandung koordinat
    if (!embedUrl) {
      try {
        const html = await response.text()
        embedUrl = extractFromHtml(html)
      } catch {
        // HTML parsing gagal, lanjut
      }
    }

    return Response.json({
      embedUrl,
      finalUrl,
      success: !!embedUrl,
      // Debug info (bisa dihapus di production)
      _debug: { resolvedTo: finalUrl.substring(0, 120) },
    })
  } catch (err: unknown) {
    clearTimeout(timeoutId)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    return Response.json(
      {
        error: isTimeout ? 'Timeout saat resolve URL' : String(err),
        success: false,
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
