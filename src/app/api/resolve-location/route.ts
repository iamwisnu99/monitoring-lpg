import { NextRequest, NextResponse } from 'next/server'

/**
 * GET  /api/resolve-location?url=<encoded_url>  → single URL
 * POST /api/resolve-location  body: { urls: string[] } → batch (multiple URLs)
 *
 * Mengikuti redirect dari Google Maps short link (maps.app.goo.gl) di server
 * sehingga bebas CORS dan bisa di-cache oleh CDN.
 */

// ─── Single URL ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
  }

  const resolvedUrl = await followRedirect(url)
  return NextResponse.json({ resolvedUrl }, {
    headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
  })
}

// ─── Batch URLs ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let urls: string[]
  try {
    const body = await req.json()
    urls = body.urls
    if (!Array.isArray(urls) || urls.length === 0) throw new Error()
  } catch {
    return NextResponse.json({ error: 'Body must be { urls: string[] }' }, { status: 400 })
  }

  // Resolve semua URL secara paralel di server (tanpa CORS, tanpa chunking)
  const settled = await Promise.allSettled(urls.map(followRedirect))

  const results: Record<string, string> = {}
  urls.forEach((url, i) => {
    const r = settled[i]
    results[url] = r.status === 'fulfilled' ? r.value : url
  })

  return NextResponse.json({ results }, {
    headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
  })
}

// ─── Helper ───────────────────────────────────────────────────────────────────
async function followRedirect(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LocationResolver/1.0)' },
    })
    return response.url || url
  } catch {
    return url
  }
}
