'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Warehouse, Save, Loader2, AlertCircle, User, Phone } from 'lucide-react'

export default function TambahPangkalanPage() {
  const router = useRouter()
  const [nama, setNama] = useState('')
  const [penanggungJawab, setPenanggungJawab] = useState('')
  const [nomorTelepon, setNomorTelepon] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama.trim() || !penanggungJawab.trim()) {
      setError('Semua field wajib diisi.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Sesi telah habis, silakan login kembali.')
      setLoading(false)
      return
    }

    const namaAgen = (user.user_metadata?.nama_agen as string) || ''

    const { error: insertError } = await supabase.from('pangkalan').insert({
      nama_pangkalan: nama.trim(),
      penanggung_jawab: penanggungJawab.trim(),
      nomor_telepon: nomorTelepon.trim() || null,
      user_id: user.id,
      nama_agen: namaAgen,
    })

    if (insertError) {
      setError('Gagal menyimpan data. Coba lagi.')
      setLoading(false)
      return
    }

    router.push('/pangkalan')
    router.refresh()
  }

  return (
    <div className="animate-fade-in max-w-lg">
      {/* Back */}
      <Link href="/pangkalan"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Daftar Pangkalan
      </Link>

      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#ffffff' }}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100"
          style={{ background: 'linear-gradient(135deg, #009345, #00b356)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Tambah Pangkalan</h1>
            <p className="text-green-100 text-xs">Isi data pangkalan baru</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="nama_pangkalan" className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Pangkalan <span className="text-red-500">*</span>
            </label>
            <input
              id="nama_pangkalan"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              placeholder="Contoh: Pangkalan Agus"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
              style={{ background: '#f8fafc' }}
            />
          </div>

          <div>
            <label htmlFor="penanggung_jawab" className="block text-sm font-medium text-slate-700 mb-1.5">
              Penanggung Jawab <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                id="penanggung_jawab" type="text" value={penanggungJawab}
                onChange={(e) => setPenanggungJawab(e.target.value)} required
                placeholder="Contoh: Agus Kurniawan"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white"
                onFocus={e => e.currentTarget.style.borderColor = '#009345'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div>
            <label htmlFor="nomor_telepon" className="block text-sm font-medium text-slate-700 mb-1.5">
              Nomor Telepon
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                id="nomor_telepon" type="tel" value={nomorTelepon}
                onChange={(e) => setNomorTelepon(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white"
                onFocus={e => e.currentTarget.style.borderColor = '#009345'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/pangkalan"
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center transition-all hover:bg-slate-100 active:scale-[0.98]"
              style={{ background: '#f1f5f9', color: '#64748b' }}
            >
              Batal
            </Link>
            <button
              id="btn-simpan-pangkalan"
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #009345, #00b356)' }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
