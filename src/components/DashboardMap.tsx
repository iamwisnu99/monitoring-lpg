'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapPin, Layers, Loader2 } from 'lucide-react'
import { TabungIcon } from './icons/TabungIcon'
import CustomSelect, { type SelectOption } from './CustomSelect'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RawWarungForMap {
  id: string
  nama_warung: string
  tabung_dimiliki: number | null
  harga_jual: number
  link_lokasi: string
  pangkalan_id: string
  nama_pangkalan: string
}

interface Props {
  warungs: RawWarungForMap[]
  pangkalanList: { id: string; nama: string }[]
}

// ─── LocalStorage koordinat cache ─────────────────────────────────────────────
const LS_KEY = 'warung_coords_v1'
const CACHE_TTL = 14 * 24 * 60 * 60 * 1000 // 14 hari

interface CacheEntry { lat: number; lng: number; ts: number }
type CacheStore = Record<string, CacheEntry>

function readCache(): CacheStore {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as CacheStore) : {}
  } catch { return {} }
}

function getCached(url: string): { lat: number; lng: number } | null {
  try {
    const entry = readCache()[url]
    if (!entry) return null
    if (Date.now() - entry.ts > CACHE_TTL) return null   // kedaluwarsa
    return { lat: entry.lat, lng: entry.lng }
  } catch { return null }
}

function setCache(url: string, coords: { lat: number; lng: number }) {
  try {
    const store = readCache()
    // Bersihkan entry yang sudah kedaluwarsa sebelum tulis
    const now = Date.now()
    for (const k of Object.keys(store)) {
      if (now - store[k].ts > CACHE_TTL) delete store[k]
    }
    store[url] = { lat: coords.lat, lng: coords.lng, ts: now }
    localStorage.setItem(LS_KEY, JSON.stringify(store))
  } catch { /* quota exceeded, ignore */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null
  try {
    const at = url.match(/@([-+]?[\d.]+),([-+]?[\d.]+)/)
    if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) }

    const bang = url.match(/!3d([-+]?[\d.]+)!4d([-+]?[\d.]+)/)
    if (bang) return { lat: parseFloat(bang[1]), lng: parseFloat(bang[2]) }

    const q = url.match(/[?&](?:q|query)=([-+]?[\d.]+),([-+]?[\d.]+)/)
    if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) }

    const re = /([-+]?[\d.]+),([-+]?[\d.]+)/g
    let m
    while ((m = re.exec(url)) !== null) {
      const lat = parseFloat(m[1]), lng = parseFloat(m[2])
      if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) return { lat, lng }
    }
  } catch { /* ignore */ }
  return null
}

/**
 * Resolve koordinat dari URL Maps:
 * 1. Ekstrak langsung dari URL panjang
 * 2. Cek localStorage cache
 * 3. Panggil /api/resolve-maps (hanya jika belum ada di cache)
 */
async function resolveCoords(url: string): Promise<{ lat: number; lng: number } | null> {
  // 1. Ekstrak langsung (URL panjang sudah ada koordinat)
  const direct = extractCoordsFromUrl(url)
  if (direct) {
    setCache(url, direct) // simpan juga agar konsisten
    return direct
  }

  // 2. Cek cache
  const cached = getCached(url)
  if (cached) return cached

  // 3. Panggil API — hanya untuk short URL yang belum pernah di-resolve
  try {
    const res = await fetch(`/api/resolve-maps?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const data: { embedUrl?: string | null; finalUrl?: string; success: boolean } = await res.json()

    if (data.success) {
      let coords: { lat: number; lng: number } | null = null
      if (data.finalUrl) coords = extractCoordsFromUrl(data.finalUrl)
      if (!coords && data.embedUrl) coords = extractCoordsFromUrl(data.embedUrl)
      if (coords) {
        setCache(url, coords) // simpan ke cache
        return coords
      }
    }
  } catch { /* ignore */ }
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardMap({ warungs, pangkalanList }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)
  /** Guard: cegah rebuildMarkers berjalan bersamaan */
  const isRunningRef = useRef(false)
  /** Versi build — jika berubah saat sedang async, batalkan */
  const buildVersionRef = useRef(0)

  const [selectedPangkalan, setSelectedPangkalan] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState(0)
  const [isMapReady, setIsMapReady] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  // ── Memoize filteredWarungs agar referensi stabil ──────────────────────────
  // Tanpa useMemo, array baru setiap render → useCallback berubah → infinite loop
  const filteredWarungs = useMemo(
    () => selectedPangkalan === 'all'
      ? warungs
      : warungs.filter(w => w.pangkalan_id === selectedPangkalan),
    [warungs, selectedPangkalan]
  )

  // ── Initialize Leaflet map (once) ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return

    const container = mapRef.current as any
    if (container._leaflet_id) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
        markersLayerRef.current = null
      } else {
        try { container._leaflet_id = undefined } catch { /* ignore */ }
      }
    }
    if (container._leaflet_id) return

    let isMounted = true

    const init = async () => {
      const L = await import('leaflet')
      if (!isMounted || !mapRef.current) return
      const c = mapRef.current as any
      if (c._leaflet_id) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, { center: [-2.5, 118], zoom: 5, zoomControl: false })
      leafletMapRef.current = map
      L.control.zoom({ position: 'topright' }).addTo(map)
      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '© Google Maps',
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }).addTo(map)
      markersLayerRef.current = L.layerGroup().addTo(map)

      if (isMounted) setIsMapReady(true)
    }

    init()

    return () => {
      isMounted = false
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
        markersLayerRef.current = null
      }
      setIsMapReady(false)
    }
  }, [])

  // ── Rebuild markers — dipanggil hanya saat filteredWarungs atau isMapReady berubah ─
  const rebuildMarkers = useCallback(async () => {
    if (!isMapReady || !markersLayerRef.current || !leafletMapRef.current) return

    // Guard: batalkan jika sudah ada proses berjalan
    if (isRunningRef.current) return
    isRunningRef.current = true

    // Naikkan versi — proses lama akan tahu harus berhenti
    buildVersionRef.current += 1
    const myVersion = buildVersionRef.current

    const L = await import('leaflet')
    const layer = markersLayerRef.current
    layer.clearLayers()

    const withLocation = filteredWarungs.filter(w => w.link_lokasi?.trim())
    if (withLocation.length === 0) {
      setVisibleCount(0)
      setIsResolving(false)
      isRunningRef.current = false
      return
    }

    setIsResolving(true)

    // Buat icon dari TabungIcon
    const tabungSvgHtml = renderToStaticMarkup(<TabungIcon size={40} className="block" />)
    const tabungIcon = L.divIcon({
      html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.45));cursor:pointer;">
        <div style="color:#B0D14B;width:40px;height:40px">${tabungSvgHtml}</div>
        <div style="width:2px;height:8px;background:#3a6b08;margin-top:-2px;border-radius:0 0 2px 2px;"></div>
      </div>`,
      className: '',
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -52],
    })

    // Resolve semua koordinat — prioritaskan yang sudah ada di cache (tidak panggil API)
    const resolved = await Promise.all(
      withLocation.map(async (w) => {
        const coords = await resolveCoords(w.link_lokasi)
        return { w, coords }
      })
    )

    // Batalkan jika versi sudah ketinggalan (filter berubah saat sedang resolve)
    if (myVersion !== buildVersionRef.current) {
      isRunningRef.current = false
      return
    }

    if (!markersLayerRef.current || !leafletMapRef.current) {
      setIsResolving(false)
      isRunningRef.current = false
      return
    }

    const bounds: [number, number][] = []
    let count = 0

    const popupIconHtml = renderToStaticMarkup(<TabungIcon size={20} />)

    for (const { w, coords } of resolved) {
      if (!coords) continue

      const hargaFmt = w.harga_jual
        ? `Rp ${w.harga_jual.toLocaleString('id-ID')}`
        : '<span style="color:#f59e0b;font-style:italic">Belum diatur</span>'
      const tabungTxt = w.tabung_dimiliki !== null
        ? `<strong style="color:#1e293b">${w.tabung_dimiliki}</strong> tabung`
        : '<span style="color:#f59e0b;font-style:italic">Belum diatur</span>'

      const marker = L.marker([coords.lat, coords.lng], { icon: tabungIcon })
      marker.bindPopup(`
        <div style="font-family:system-ui,-apple-system,sans-serif;min-width:210px;max-width:250px;padding:2px 0 4px">
          <div style="display:flex;align-items:center;gap:8px;border-bottom:1px solid #f1f5f9;padding-bottom:8px;margin-bottom:10px">
            <div style="width:36px;height:36px;border-radius:10px;background:#dcfce7;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#B0D14B">
              ${popupIconHtml}
            </div>
            <div style="flex:1;min-width:0">
              <p style="margin:0;font-weight:700;font-size:13px;color:#1e293b;line-height:1.35;word-break:break-word">${w.nama_warung}</p>
              <p style="margin:3px 0 0;font-size:11px;color:#64748b">📍 ${w.nama_pangkalan}</p>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:7px;font-size:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="color:#64748b">🫙 Tabung Dimiliki</span>
              <span>${tabungTxt}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="color:#64748b">💰 Harga Jual</span>
              <span style="font-weight:600;color:#009345">${hargaFmt}</span>
            </div>
          </div>
          <a href="${w.link_lokasi}" target="_blank" rel="noopener noreferrer"
            style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:10px;padding:7px 0;border-radius:9px;background:#f0fdf4;color:#009345;font-size:11px;font-weight:600;text-decoration:none;border:1px solid #bbf7d0">
            🗺️ Buka di Google Maps
          </a>
        </div>
      `, { maxWidth: 270, className: 'warung-popup' })

      layer.addLayer(marker)
      bounds.push([coords.lat, coords.lng])
      count++
    }

    setVisibleCount(count)
    setIsResolving(false)
    isRunningRef.current = false

    if (bounds.length > 0 && leafletMapRef.current) {
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [isMapReady, filteredWarungs]) // filteredWarungs stabil berkat useMemo

  useEffect(() => {
    rebuildMarkers()
  }, [rebuildMarkers])

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#ffffff' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#dcfce7' }}>
            <Layers className="w-4 h-4" style={{ color: '#009345' }} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 leading-tight">Peta Lokasi Warung</h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              {isResolving
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Memuat koordinat...</>
                : <>{visibleCount} warung ditampilkan</>
              }
            </p>
          </div>
        </div>

        <CustomSelect
          value={selectedPangkalan}
          onChange={setSelectedPangkalan}
          options={[
            { value: 'all', label: 'Semua Pangkalan' },
            ...pangkalanList.map((p): SelectOption => ({ value: p.id, label: p.nama })),
          ]}
          placeholder="Semua Pangkalan"
          className="w-48"
        />
      </div>

      {/* Map */}
      <div style={{ position: 'relative', height: '420px' }}>
        <style>{`
          @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
          .warung-popup .leaflet-popup-content-wrapper {
            border-radius:16px;
            box-shadow:0 12px 40px rgba(0,0,0,0.15);
            border:1px solid #e2e8f0;
            padding:0;
          }
          .warung-popup .leaflet-popup-content { margin:12px 14px; }
          .warung-popup .leaflet-popup-tip { background:#fff; }
          .leaflet-control-zoom a { border-radius:8px !important; }
          .leaflet-control-zoom { border:none !important; box-shadow:0 2px 8px rgba(0,0,0,0.15) !important; }
        `}</style>

        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Empty state */}
        {isMapReady && !isResolving && visibleCount === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(248,250,252,0.88)', backdropFilter: 'blur(4px)',
            zIndex: 1000, gap: '8px',
          }}>
            <MapPin className="w-8 h-8 text-slate-300" />
            <p className="text-slate-500 text-sm font-medium">Tidak ada titik lokasi</p>
            <p className="text-slate-300 text-xs">Warung belum memiliki link Google Maps yang valid</p>
          </div>
        )}

        {/* Resolving overlay */}
        {isResolving && (
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, background: 'white', borderRadius: '99px',
            padding: '6px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: '#475569', fontFamily: 'system-ui,sans-serif',
          }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#009345' }} />
            Mencari koordinat warung...
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#B0D14B' }} />
          <span className="text-xs text-slate-400">= 1 titik warung</span>
        </div>
        <span className="text-xs text-slate-300">•</span>
        <span className="text-xs text-slate-400">Klik marker untuk detail</span>
      </div>
    </div>
  )
}
