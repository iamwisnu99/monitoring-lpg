import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, Truck, Warehouse, Users, Calendar,
  MapPin, User, CreditCard, ExternalLink,
} from 'lucide-react'
import DeleteDistribusiButton from '@/components/DeleteDistribusiButton'
import MapEmbed from '@/components/MapEmbed'
import WarungList from '@/components/WarungList'

interface Props { params: Promise<{ id: string }> }

export default async function DetailDistribusiPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Dapatkan info distribusi utama (berdasarkan ID di URL)
  const { data: mainDist } = await supabase
    .from('distribusi')
    .select('*, pangkalan!inner(*)')
    .eq('id', id)
    .eq('pangkalan.user_id', user!.id)
    .single()

  if (!mainDist) notFound()

  // 2. Dapatkan SEMUA warung yang pernah dikirim oleh pangkalan ini (lintas distribusi/waktu)
  const { data: allWarungs } = await supabase
    .from('warung_tujuan')
    .select('*, distribusi!inner(pangkalan_id)')
    .eq('distribusi.pangkalan_id', mainDist.pangkalan_id)
    .order('created_at', { ascending: false })

  const pangkalan = mainDist.pangkalan as any
  const warungList = (allWarungs || []) as any[]
  const warungDenganLokasi = warungList.filter(w => w.link_lokasi)

  return (
    <div className="animate-fade-in space-y-5">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link href={`/pangkalan/${pangkalan.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Pangkalan
        </Link>
        <div className="flex items-center gap-2">
          <DeleteDistribusiButton
            distribusiId={id}
            pangkalanId={pangkalan.id}
            pengirim={mainDist.pengirim}
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b"
          style={{ background: 'linear-gradient(135deg, #009345, #00b356)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Data Warung Pangkalan</h1>
                <p className="text-green-100 text-sm">Rekap seluruh pengiriman warung</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#dcfce7' }}>
              <Warehouse className="w-4 h-4" style={{ color: '#009345' }} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Pangkalan</p>
              <Link href={`/pangkalan/${pangkalan.id}`}
                className="text-sm font-semibold hover:underline" style={{ color: '#009345' }}>
                {pangkalan.nama_pangkalan}
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#d1fae5' }}>
              <Users className="w-4 h-4" style={{ color: '#059669' }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Pengirim (Terakhir)</p>
              <p className="text-sm font-semibold text-slate-800 whitespace-pre-wrap break-words">{mainDist.pengirim}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 sm:col-span-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#f1f5f9' }}>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Update Terakhir</p>
              <p className="text-sm font-semibold text-slate-800">
                {new Date(mainDist.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' } as Intl.DateTimeFormatOptions)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warung List */}
      <WarungList warungs={warungList} distribusiId={id} />
    </div>
  )
}
