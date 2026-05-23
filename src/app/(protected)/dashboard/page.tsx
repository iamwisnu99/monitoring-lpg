import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Ringkasan data pangkalan, distribusi, dan warung tujuan LPG 3Kg Anda.',
  openGraph: { title: 'Dashboard - Kemitraan Agen' },
}
import Link from 'next/link'
import {
  Warehouse,
  Truck,
  TrendingUp,
  Plus,
  ArrowRight,
  BarChart3,
  Calendar,
} from 'lucide-react'
import type { RawWarungForMap } from '@/components/DashboardMap'
import DashboardMapWrapper from '@/components/DashboardMapWrapper'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Fetch stats, recent distribusi, dan pangkalan secara paralel ────────────
  const [statsResults, recentResult, pangkalanResult] = await Promise.all([
    Promise.all([
      supabase.from('pangkalan').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
      supabase.from('distribusi').select('*, pangkalan!inner(user_id)', { count: 'exact', head: true }).eq('pangkalan.user_id', user!.id),
      supabase.from('warung_tujuan').select('*, distribusi!inner(pangkalan!inner(user_id))', { count: 'exact', head: true }).eq('distribusi.pangkalan.user_id', user!.id),
    ]),
    supabase
      .from('distribusi')
      .select('*, pangkalan(nama_pangkalan, user_id)')
      .eq('pangkalan.user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('pangkalan')
      .select('id, nama_pangkalan')
      .eq('user_id', user!.id)
      .order('nama_pangkalan', { ascending: true }),
  ])

  const [{ count: totalPangkalan }, { count: totalDistribusi }, { count: totalWarung }] = statsResults
  const recentDistribusi = recentResult.data
  const pangkalanList = (pangkalanResult.data ?? []).map((p: any) => ({ id: p.id, nama: p.nama_pangkalan }))
  const userPangkalanIds = pangkalanList.map(p => p.id)

  // ── Fetch warung untuk peta (2 langkah agar filter user terjamin) ───────────
  // Langkah 1: ambil distribusi milik user
  const { data: distribusiData } = userPangkalanIds.length > 0
    ? await supabase
        .from('distribusi')
        .select('id, pangkalan_id')
        .in('pangkalan_id', userPangkalanIds)
    : { data: [] }

  const distribusiIds = (distribusiData ?? []).map((d: any) => d.id)
  const distribusiPangkalanMap: Record<string, string> = {}
  for (const d of distribusiData ?? []) {
    distribusiPangkalanMap[(d as any).id] = (d as any).pangkalan_id
  }
  const pangkalanNameMap: Record<string, string> = {}
  for (const p of pangkalanResult.data ?? []) {
    pangkalanNameMap[(p as any).id] = (p as any).nama_pangkalan
  }

  // Langkah 2: ambil semua warung yang memiliki link_lokasi untuk distribusi tersebut
  const rawWarungs: RawWarungForMap[] = []
  if (distribusiIds.length > 0) {
    const { data: warungData } = await supabase
      .from('warung_tujuan')
      .select('id, nama_warung, tabung_dimiliki, harga_jual, link_lokasi, distribusi_id')
      .in('distribusi_id', distribusiIds)
      .not('link_lokasi', 'is', null)
      .neq('link_lokasi', '')

    for (const w of (warungData ?? []) as any[]) {
      const pangkalanId = distribusiPangkalanMap[w.distribusi_id]
      const namaPangkalan = pangkalanNameMap[pangkalanId]
      if (!pangkalanId || !namaPangkalan) continue
      rawWarungs.push({
        id: w.id,
        nama_warung: w.nama_warung,
        tabung_dimiliki: w.tabung_dimiliki,
        harga_jual: w.harga_jual,
        link_lokasi: w.link_lokasi,
        pangkalan_id: pangkalanId,
        nama_pangkalan: namaPangkalan,
      })
    }
  }

  const namaAgen = user?.user_metadata?.nama_agen as string | undefined

  const stats = [
    {
      label: 'Total Pangkalan',
      value: totalPangkalan ?? 0,
      icon: Warehouse,
      color: '#009345',
      bg: '#dcfce7',
      href: '/pangkalan',
    },
    {
      label: 'Total Distribusi',
      value: totalDistribusi ?? 0,
      icon: Truck,
      color: '#007a38',
      bg: '#bbf7d0',
      href: '/distribusi',
    },
    {
      label: 'Total Warung',
      value: totalWarung ?? 0,
      icon: TrendingUp,
      color: '#E8342A',
      bg: '#fee2e2',
      href: '/monitoring',
    },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Selamat datang,{' '}
            <span className="font-semibold" style={{ color: '#009345' }}>
              {namaAgen || user?.email}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/pangkalan/tambah"
            id="btn-tambah-pangkalan"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #007a38, #009345)', boxShadow: '0 4px 12px rgba(0,147,69,0.3)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Pangkalan</span>
            <span className="sm:hidden">Pangkalan</span>
          </Link>
          <Link
            href="/monitoring"
            id="btn-monitoring"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-slate-200 active:scale-[0.98]"
            style={{ background: '#e2e8f0', color: '#475569' }}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Monitoring</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link href={href} key={label}
            className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
            style={{ background: '#ffffff' }}>
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <p className="text-3xl font-bold mt-3" style={{ color }}>{value}</p>
            <p className="text-slate-500 text-sm mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/pangkalan"
          className="flex items-center gap-4 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #007a38, #009345)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 flex-shrink-0">
            <Warehouse className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">Kelola Pangkalan</p>
            <p className="text-green-100 text-sm">Lihat dan tambah data pangkalan</p>
          </div>
          <ArrowRight className="w-5 h-5 text-white/60" />
        </Link>

        <Link href="/distribusi"
          className="flex items-center gap-4 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #E8342A, #ff4a3f)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 flex-shrink-0">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">Riwayat Distribusi</p>
            <p className="text-red-100 text-sm">Lihat semua data distribusi</p>
          </div>
          <ArrowRight className="w-5 h-5 text-white/60" />
        </Link>
      </div>

      {/* Map */}
      <DashboardMapWrapper warungs={rawWarungs} pangkalanList={pangkalanList} />

      {/* Recent Distribusi */}
      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#ffffff' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Distribusi Terbaru</h2>
          <Link href="/distribusi" className="text-sm font-medium hover:underline" style={{ color: '#009345' }}>Lihat semua</Link>
        </div>
        <div className="divide-y divide-slate-50">
          {recentDistribusi && recentDistribusi.length > 0 ? (
            recentDistribusi.map((d: any) => (
              <div key={d.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#dcfce7' }}>
                  <Truck className="w-4 h-4" style={{ color: '#009345' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {d.pangkalan?.nama_pangkalan || 'Pangkalan'}
                  </p>
                  <p className="text-xs text-slate-500">Pengirim: {d.pengirim}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(d.tanggal_kirim).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-10 text-center">
              <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Belum ada data distribusi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
