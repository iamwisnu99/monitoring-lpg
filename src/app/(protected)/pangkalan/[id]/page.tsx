import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, Warehouse, Users, Plus, Truck, Calendar,
  MapPin, Phone, Pencil, Hash, ChevronLeft, ChevronRight, Store,
  User, CreditCard,
} from 'lucide-react'
import DeletePangkalanButton from '@/components/DeletePangkalanButton'
import { TabungIcon } from '@/components/icons/TabungIcon'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('pangkalan').select('nama_pangkalan').eq('id', id).single()
  return {
    title: data?.nama_pangkalan || 'Detail Pangkalan',
  }
}

const PER_PAGE = 5

export default async function DetailPangkalanPage({ params, searchParams }: Props) {
  const { id } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1'))
  const offset = (page - 1) * PER_PAGE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Ambil data pangkalan utama (1 round-trip)
  const { data: pangkalan } = await supabase
    .from('pangkalan')
    .select('*, parent:parent_id(id, nama_pangkalan)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!pangkalan) notFound()

  const groupId = pangkalan.parent_id ? pangkalan.parent_id : pangkalan.id

  // 2. Ambil data grup dan daftar warung secara PARALEL
  const [groupRes, warungResInitial] = await Promise.all([
    supabase
      .from('pangkalan')
      .select('id, nama_pangkalan, penanggung_jawab')
      .or(`id.eq.${groupId},parent_id.eq.${groupId}`),
    // Ambil daftar warung untuk ID pangkalan ini
    supabase
      .from('warung_tujuan')
      .select('*, distribusi!inner(id, created_at, pangkalan_id)', { count: 'exact' })
      .eq('distribusi.pangkalan_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PER_PAGE - 1)
  ])

  const groupPangkalans = groupRes.data || []
  const groupIds = groupPangkalans.map(p => p.id)
  
  let warungList = warungResInitial.data || []
  let totalWarung = warungResInitial.count ?? 0

  // Jika ini bagian dari grup, kita ambil data warung untuk SELURUH GRUP
  if (groupIds.length > 1) {
    const { data: groupWarungs, count: groupCount } = await supabase
      .from('warung_tujuan')
      .select('*, distribusi!inner(id, created_at, pangkalan_id)', { count: 'exact' })
      .in('distribusi.pangkalan_id', groupIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + PER_PAGE - 1)
    
    if (groupWarungs) {
      warungList = groupWarungs
      totalWarung = groupCount ?? 0
    }
  }

  const subPangkalans = groupPangkalans.filter(p => p.id !== pangkalan.id)
  const totalPages = Math.ceil(totalWarung / PER_PAGE)

  return (
    <div className="animate-fade-in space-y-5">
      {/* Back + Action row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link href="/pangkalan"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Daftar Pangkalan
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/pangkalan/${id}/edit`} id="btn-edit-pangkalan"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-slate-100 text-slate-600 border border-slate-200">
            <Pencil className="w-4 h-4" /><span className="hidden sm:inline">Edit</span>
          </Link>
          <DeletePangkalanButton pangkalanId={id} namaPangkalan={pangkalan.nama_pangkalan} />
          <Link href={`/pangkalan/${id}/distribusi/tambah`} id="btn-tambah-distribusi"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #007a38, #009345)' }}>
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">Distribusi</span>
          </Link>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">

        {/* ─── KOLOM KIRI: Profil ─── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #009345, #00b356)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 flex-shrink-0">
                  <Warehouse className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-white truncate">{pangkalan.nama_pangkalan}</h1>
                  <p className="text-green-100 text-xs">Detail Pangkalan</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              <div className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#dcfce7' }}>
                  <Users className="w-4 h-4" style={{ color: '#009345' }} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Penanggung Jawab</p>
                  <p className="text-sm font-semibold text-slate-700">{pangkalan.penanggung_jawab}</p>
                </div>
              </div>

              {pangkalan.nomor_telepon && (
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#dbeafe' }}>
                    <Phone className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Nomor Telepon</p>
                    <a href={`tel:${pangkalan.nomor_telepon}`} className="text-sm font-semibold text-blue-600 hover:underline">
                      {pangkalan.nomor_telepon}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fef3c7' }}>
                  <Truck className="w-4 h-4" style={{ color: '#d97706' }} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Warung</p>
                  <p className="text-2xl font-bold" style={{ color: '#009345' }}>{totalWarung}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f1f5f9' }}>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Terdaftar Sejak</p>
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(pangkalan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {pangkalan.nama_agen && (
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
                    <Hash className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Agen</p>
                    <p className="text-sm font-medium text-slate-700">{pangkalan.nama_agen}</p>
                  </div>
                </div>
              )}

              {pangkalan.parent && (
                <div className="flex items-center gap-3 px-5 py-3.5 bg-green-50/50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fff' }}>
                    <ArrowLeft className="w-4 h-4 text-green-600 rotate-90" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Pangkalan Utama</p>
                    <Link href={`/pangkalan/${(pangkalan.parent as any).id}`} className="text-sm font-bold text-green-700 hover:underline">
                      {(pangkalan.parent as any).nama_pangkalan}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Pangkalan Lain (Sub-Pangkalan) ─── */}
          {subPangkalans && subPangkalans.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
              <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {pangkalan.parent_id ? 'Pangkalan Lain' : 'Cabang / Pangkalan Lain'}
                </h3>
              </div>
              <div className="divide-y divide-slate-50">
                {subPangkalans.map((sub) => (
                  <Link 
                    key={sub.id} 
                    href={`/pangkalan/${sub.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                        <Warehouse className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 group-hover:text-green-700">{sub.nama_pangkalan}</p>
                        <p className="text-[10px] text-slate-400">{sub.penanggung_jawab}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href={`/pangkalan/${id}/distribusi/tambah`}
            className="lg:hidden flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #007a38, #009345)' }}>
            <Plus className="w-4 h-4" /> Tambah Distribusi Baru
          </Link>
        </div>

        {/* ─── KOLOM KANAN: Distribusi ─── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-800">Daftar Warung</h2>
              <p className="text-xs text-slate-400 mt-0.5">{totalWarung} warung tercatat</p>
            </div>
            <Link href={`/pangkalan/${id}/distribusi/tambah`}
              className="hidden lg:flex items-center gap-1.5 text-sm font-medium hover:underline"
              style={{ color: '#009345' }}>
              <Plus className="w-3.5 h-3.5" /> Tambah
            </Link>
          </div>

          {/* List */}
          {warungList && warungList.length > 0 ? (
            <>
              <div className="flex-1 divide-y divide-slate-50">
                {warungList.map((w) => {
                  const dist = w.distribusi as any
                  return (
                    <div key={w.id} className="px-5 py-4">
                      {/* Nama Warung + Link */}
                      <div className="flex items-center justify-between mb-2">
                        <Link
                          href={`/distribusi/${dist?.id}`}
                          className="flex items-center gap-2 group/title"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 group-hover/title:bg-green-600 group-hover/title:text-white transition-all">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700 group-hover/title:text-green-700 transition-colors">{w.nama_warung}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <User className="w-3 h-3" /> {w.nama_penerima}
                            </p>
                          </div>
                        </Link>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {dist?.created_at ? new Date(dist.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </div>
                          <span className="text-[10px] font-medium text-slate-400">Terdaftar</span>
                        </div>
                      </div>

                      {/* Info Tambahan */}
                      <div className="flex items-center gap-3 pl-10">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>{w.harga_jual ? `Rp ${w.harga_jual.toLocaleString('id-ID')}` : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <TabungIcon size={14} className="text-slate-400" />
                          <span>{w.tabung_dimiliki || 0} Tabung</span>
                        </div>
                        {w.link_lokasi && (
                          <a href={w.link_lokasi} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-green-600 hover:underline">
                            <MapPin className="w-3 h-3" /> Lokasi
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    Hal. {page} / {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    {page > 1 ? (
                      <Link href={`/pangkalan/${id}?page=${page - 1}`}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </Link>
                    ) : (
                      <span className="p-2 rounded-lg text-slate-200">
                        <ChevronLeft className="w-4 h-4" />
                      </span>
                    )}
                    {page < totalPages ? (
                      <Link href={`/pangkalan/${id}?page=${page + 1}`}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <span className="p-2 rounded-lg text-slate-200">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center">
              <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm mb-4">Belum ada data warung</p>
              <Link href={`/pangkalan/${id}/distribusi/tambah`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #009345, #00b356)' }}>
                <Plus className="w-4 h-4" /> Tambah Warung
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
