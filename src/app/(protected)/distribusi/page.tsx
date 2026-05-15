import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Store, Warehouse, Calendar, Search, MapPin, CreditCard, User, Filter } from 'lucide-react'
import { TabungIcon } from '@/components/icons/TabungIcon'
import DistribusiClient from './DistribusiClient'

export const metadata: Metadata = {
  title: 'Distribusi',
  description: 'Lihat semua data warung penerima LPG 3Kg dari seluruh pangkalan Anda.',
  openGraph: { title: 'Distribusi - Kemitraan Agen' },
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
        .select('id, created_at, pengirim, pangkalan!inner(id, nama_pangkalan, user_id), warung_tujuan(id, nama_warung, nama_penerima, tabung_dimiliki, harga_jual, link_lokasi)')
        .eq('pangkalan.user_id', user!.id)

      if (search) {
        query = query.or(`pengirim.ilike.%${search}%,warung_tujuan.nama_warung.ilike.%${search}%,warung_tujuan.nama_penerima.ilike.%${search}%`)
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
    tabung_dimiliki: number | null
    harga_jual: number
    linkLokasi: string | null
    distribusiId: string
    namaPangkalan: string
    createdAt: string
  }

  const allWarung: WarungCard[] = (distribusiList ?? []).flatMap((d) => {
    const pangkalan = d.pangkalan as unknown as { id: string; nama_pangkalan: string }
    return ((d.warung_tujuan as unknown as { id: string; nama_warung: string; nama_penerima: string; tabung_dimiliki: number | null; harga_jual: number; link_lokasi: string | null }[]) ?? []).map((w) => ({
      warungId: w.id,
      namaWarung: w.nama_warung,
      namaPenerima: w.nama_penerima,
      tabung_dimiliki: w.tabung_dimiliki,
      harga_jual: w.harga_jual,
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

      {/* Client Logic: Search, Sort by Distance, and Grid */}
      {filtered.length > 0 ? (
        <DistribusiClient initialWarungs={filtered} />
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
