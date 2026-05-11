import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Store, Warehouse, Calendar, Search, MapPin, CreditCard, User, Filter } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard Distribusi',
  description: 'Lihat semua data warung penerima LPG 3Kg dari seluruh pangkalan Anda.',
  openGraph: { title: 'Dashboard Distribusi — Monitoring Distribusi LPG 3Kg' },
}

interface SearchParams { q?: string; pangkalan_id?: string }

export default async function DistribusiPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { q: search, pangkalan_id: pangkalanFilter } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Jalankan query secara PARALEL
  const [pangkalanRes, distribusiRes] = await Promise.all([
    supabase
      .from('pangkalan')
      .select('id, nama_pangkalan')
      .eq('user_id', user!.id)
      .order('nama_pangkalan'),
    (() => {
      let query = supabase
        .from('distribusi')
        .select('id, created_at, pengirim, pangkalan!inner(id, nama_pangkalan, user_id), warung_tujuan(id, nama_warung, nama_penerima, nik, link_lokasi)')
        .eq('pangkalan.user_id', user!.id)

      if (search) {
        query = query.or(`pengirim.ilike.%${search}%,warung_tujuan.nama_warung.ilike.%${search}%,warung_tujuan.nama_penerima.ilike.%${search}%,warung_tujuan.nik.ilike.%${search}%`)
      }

      if (pangkalanFilter) {
        query = query.eq('pangkalan_id', pangkalanFilter)
      }

      return query.order('created_at', { ascending: false })
    })()
  ])

  const pangkalanList = pangkalanRes.data
  const distribusiList = distribusiRes.data

  // Flatten warung dari semua distribusi
  type WarungCard = {
    warungId: string
    namaWarung: string
    namaPenerima: string
    nik: string
    linkLokasi: string | null
    distribusiId: string
    namaPangkalan: string
    createdAt: string
  }

  const allWarung: WarungCard[] = (distribusiList ?? []).flatMap((d) => {
    const pangkalan = d.pangkalan as unknown as { id: string; nama_pangkalan: string }
    return ((d.warung_tujuan as unknown as { id: string; nama_warung: string; nama_penerima: string; nik: string; link_lokasi: string | null }[]) ?? []).map((w) => ({
      warungId: w.id,
      namaWarung: w.nama_warung,
      namaPenerima: w.nama_penerima,
      nik: w.nik,
      linkLokasi: w.link_lokasi,
      distribusiId: d.id,
      namaPangkalan: pangkalan?.nama_pangkalan ?? '-',
      createdAt: d.created_at,
    }))
  })

  // Filter warung by search (nama warung)
  const filtered = search
    ? allWarung.filter((w) => w.namaWarung.toLowerCase().includes(search.toLowerCase()))
    : allWarung

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Distribusi</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} warung penerima tercatat
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <form method="get" className="flex flex-col sm:flex-row gap-3">
        {/* Search by nama warung */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="search-warung"
            name="q"
            type="text"
            defaultValue={search}
            placeholder="Cari nama warung..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Filter Pangkalan */}
        <div className="relative sm:w-56">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            id="filter-pangkalan"
            name="pangkalan_id"
            defaultValue={pangkalanFilter ?? ''}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm outline-none transition-all bg-white appearance-none cursor-pointer"
          >
            <option value="">Semua Pangkalan</option>
            {pangkalanList?.map((p) => (
              <option key={p.id} value={p.id}>{p.nama_pangkalan}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #007a38, #009345)' }}
        >
          Terapkan
        </button>

        {(search || pangkalanFilter) && (
          <Link
            href="/distribusi"
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0 text-center"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Grid Warung */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((w) => (
            <Link
              key={w.warungId}
              href={`/distribusi/${w.distribusiId}`}
              id={`warung-card-${w.warungId}`}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 overflow-hidden group flex flex-col"
            >
              {/* Card header */}
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
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Warehouse className="w-3 h-3" />
                    <span className="truncate">{w.namaPangkalan}</span>
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-4 border-t border-slate-50" />

              {/* Card body */}
              <div className="px-4 py-3 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{w.namaPenerima}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-mono">{w.nik}</span>
                </div>
                {w.linkLokasi && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#009345' }}>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Lokasi tersedia</span>
                  </div>
                )}
              </div>

              {/* Card footer */}
              <div className="px-4 py-2.5 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(w.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-lg group-hover:opacity-80 transition-opacity"
                  style={{ background: '#f0fdf4', color: '#009345' }}
                >
                  Lihat →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center shadow-sm" style={{ background: '#ffffff' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#dcfce7' }}>
            <Store className="w-8 h-8" style={{ color: '#009345' }} />
          </div>
          <h3 className="font-semibold text-slate-700 mb-2">
            {search || pangkalanFilter ? 'Tidak ada warung yang sesuai filter' : 'Belum Ada Data Warung'}
          </h3>
          <p className="text-slate-400 text-sm">
            {search || pangkalanFilter ? 'Coba ubah filter pencarian' : 'Tambahkan distribusi melalui halaman pangkalan'}
          </p>
        </div>
      )}
    </div>
  )
}
