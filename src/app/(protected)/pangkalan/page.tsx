import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Pangkalan',
  description: 'Daftar semua pangkalan LPG 3Kg yang terdaftar di akun Anda.',
  openGraph: { title: 'Pangkalan — Monitoring Distribusi LPG 3Kg' },
}
import Link from 'next/link'
import { Plus, Warehouse, ChevronRight, Users, Calendar } from 'lucide-react'
import type { Pangkalan } from '@/lib/types'

export default async function PangkalanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pangkalanList } = await supabase
    .from('pangkalan')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pangkalan</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pangkalanList?.length ?? 0} pangkalan terdaftar
          </p>
        </div>
        <Link
          href="/pangkalan/tambah"
          id="btn-tambah-pangkalan"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] self-start sm:self-auto"
          style={{ background: 'linear-gradient(135deg, #009345, #00b356)', boxShadow: '0 4px 12px rgba(0,147,69,0.3)' }}
        >
          <Plus className="w-4 h-4" />
          Tambah Pangkalan
        </Link>
      </div>

      {/* List */}
      {pangkalanList && pangkalanList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {pangkalanList.map((p: Pangkalan) => (
            <Link
              key={p.id}
              href={`/pangkalan/${p.id}`}
              id={`pangkalan-${p.id}`}
              className="block rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
              style={{ background: '#ffffff' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#dcfce7' }}>
                  <Warehouse className="w-5 h-5" style={{ color: '#009345' }} />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors mt-0.5" />
              </div>
              <h3 className="font-semibold text-slate-800 mt-3 truncate">{p.nama_pangkalan}</h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-sm text-slate-500 truncate">{p.penanggung_jawab}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3 text-slate-300" />
                <p className="text-xs text-slate-400">
                  {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center shadow-sm" style={{ background: '#ffffff' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#dcfce7' }}>
            <Warehouse className="w-8 h-8" style={{ color: '#009345' }} />
          </div>
          <h3 className="font-semibold text-slate-700 mb-2">Belum Ada Pangkalan</h3>
          <p className="text-slate-400 text-sm mb-5">Tambahkan pangkalan pertama Anda untuk memulai</p>
          <Link
            href="/pangkalan/tambah"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #009345, #00b356)' }}
          >
            <Plus className="w-4 h-4" />
            Tambah Pangkalan
          </Link>
        </div>
      )}
    </div>
  )
}
