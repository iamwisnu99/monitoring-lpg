'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, Warehouse, Calendar, MapPin, CreditCard, User, Navigation2, AlertTriangle, Loader2 } from 'lucide-react'
import { TabungIcon } from '@/components/icons/TabungIcon'
import { calculateDistance, extractCoordsFromUrl, isMockLocation } from '@/lib/location-utils'

interface WarungCard {
  warungId: string
  namaWarung: string
  namaPenerima: string
  tabung_dimiliki: number | null
  harga_jual: number
  linkLokasi: string | null
  distribusiId: string
  namaPangkalan: string
  createdAt: string
}

interface Props {
  initialWarungs: WarungCard[]
}

type SortOption = 'latest' | 'nearest' | 'farthest'

export default function DistribusiClient({ initialWarungs }: Props) {
  const [sort, setSort] = useState<SortOption>('latest')
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking')
  const [isFake, setIsFake] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  useEffect(() => {
    // Cek status izin awal
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
        setGeoStatus(status.state as any)
        status.onchange = () => setGeoStatus(status.state as any)
      })
    } else {
      setGeoStatus('prompt')
    }
  }, [])

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung Geolocation.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        
        // Cek lokasi palsu
        if (isMockLocation(position)) {
          setIsFake(true)
          setUserCoords(null)
          return
        }

        setIsFake(false)
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setGeoStatus('granted')
      },
      (error) => {
        setIsLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus('denied')
        }
        console.error('Error geolocation:', error)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const sortedWarungs = [...initialWarungs].sort((a, b) => {
    if ((sort === 'nearest' || sort === 'farthest') && userCoords) {
      const coordsA = extractCoordsFromUrl(a.linkLokasi)
      const coordsB = extractCoordsFromUrl(b.linkLokasi)

      if (!coordsA && !coordsB) return 0
      if (!coordsA) return 1
      if (!coordsB) return -1

      const distA = calculateDistance(userCoords.lat, userCoords.lng, coordsA.lat, coordsA.lng)
      const distB = calculateDistance(userCoords.lat, userCoords.lng, coordsB.lat, coordsB.lng)

      return sort === 'nearest' ? distA - distB : distB - distA
    }

    // Default: Terbaru
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="space-y-6">
      {/* Fake Location Warning */}
      {isFake && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-4 animate-shake">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-red-800">Lokasi Palsu Terdeteksi!</h3>
            <p className="text-sm text-red-600">Anda terdeteksi sedang menggunakan lokasi palsu.</p>
          </div>
        </div>
      )}

      {/* Sort Control */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
        <div className="flex items-center gap-2">
          <Navigation2 className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Urutkan:</span>
          <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setSort('latest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sort === 'latest' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Terbaru
            </button>
            <button
              onClick={() => {
                if (!userCoords) handleGetLocation()
                setSort('nearest')
              }}
              disabled={geoStatus === 'denied'}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed ${
                sort === 'nearest' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Terdekat
              {isLocating && <Loader2 className="w-3 h-3 animate-spin" />}
            </button>
            <button
              onClick={() => {
                if (!userCoords) handleGetLocation()
                setSort('farthest')
              }}
              disabled={geoStatus === 'denied'}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed ${
                sort === 'farthest' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Terjauh
              {isLocating && <Loader2 className="w-3 h-3 animate-spin" />}
            </button>
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-1">
          <p className="text-[10px] text-slate-400 font-medium">
            {initialWarungs.filter(w => extractCoordsFromUrl(w.linkLokasi)).length} dari {initialWarungs.length} warung memiliki data lokasi
          </p>
          {geoStatus === 'denied' && (
            <p className="text-[10px] text-red-500 font-medium bg-red-50 px-2 py-1 rounded-lg">
              Izin lokasi ditolak. Buka pengaturan browser untuk mengaktifkan filter jarak.
            </p>
          )}
        </div>
      </div>

      {/* Grid Warung */}
      <div className="relative min-h-[400px]">
        {isLocating && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl border border-slate-100 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-200 mb-3 animate-bounce">
              <Navigation2 className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-bold text-slate-800">Mencari Lokasi Anda...</p>
            <p className="text-xs text-slate-500 mt-1">Menghitung jarak ke seluruh warung</p>
          </div>
        )}

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-all duration-500 ${isLocating ? 'opacity-30 blur-[1px]' : 'opacity-100'}`}>
          {sortedWarungs.map((w) => {
          let distanceLabel = null
          if (userCoords) {
            const coords = extractCoordsFromUrl(w.linkLokasi)
            if (coords) {
              const d = calculateDistance(userCoords.lat, userCoords.lng, coords.lat, coords.lng)
              distanceLabel = d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`
            }
          }

          return (
            <Link
              key={w.warungId}
              href={`/distribusi/${w.distribusiId}`}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 overflow-hidden group flex flex-col border border-slate-100"
            >
              <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                  style={{ background: '#dcfce7' }}
                >
                  <Store className="w-5 h-5" style={{ color: '#009345' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800 truncate leading-snug">
                    {w.namaWarung}
                  </h3>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 truncate">
                      <Warehouse className="w-2.5 h-2.5" />
                      {w.namaPangkalan}
                    </span>
                    {distanceLabel && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {distanceLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mx-4 border-t border-slate-50" />

              <div className="px-4 py-3 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{w.namaPenerima}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <TabungIcon size={14} className="text-slate-400" />
                  <span>Tabung: {w.tabung_dimiliki !== null ? w.tabung_dimiliki : <span className="text-orange-500 italic">Belum Diatur</span>}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Harga: {w.harga_jual ? `Rp ${w.harga_jual.toLocaleString('id-ID')}` : <span className="text-orange-500 italic">Belum Diatur</span>}</span>
                </div>
                {w.linkLokasi && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#009345' }}>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">Lokasi tersedia</span>
                  </div>
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(w.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all border border-green-100 text-green-600 bg-white"
                >
                  Detail →
                </span>
              </div>
            </Link>
          )
        })}
        </div>
      </div>
    </div>
  )
}
