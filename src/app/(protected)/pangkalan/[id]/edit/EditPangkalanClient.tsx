'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Warehouse, Save, Loader2, AlertCircle, User, Phone } from 'lucide-react'

interface Props {
  pangkalan: {
    id: string
    nama_pangkalan: string
    penanggung_jawab: string
    nomor_telepon: string | null
  }
}

export default function EditPangkalanClient({ pangkalan }: Props) {
  const router = useRouter()
  const [nama, setNama] = useState(pangkalan.nama_pangkalan)
  const [penanggungJawab, setPenanggungJawab] = useState(pangkalan.penanggung_jawab)
  const [nomorTelepon, setNomorTelepon] = useState(pangkalan.nomor_telepon || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama.trim() || !penanggungJawab.trim()) {
      setError('Nama pangkalan dan penanggung jawab wajib diisi.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('pangkalan')
      .update({
        nama_pangkalan: nama.trim(),
        penanggung_jawab: penanggungJawab.trim(),
        nomor_telepon: nomorTelepon.trim() || null,
      })
      .eq('id', pangkalan.id)

    if (updateError) {
      setError('Gagal menyimpan perubahan. Coba lagi.')
      setLoading(false)
      return
    }
    router.push(`/pangkalan/${pangkalan.id}`)
    router.refresh()
  }

  return (
    <div className="animate-fade-in max-w-lg">
      <Link href={`/pangkalan/${pangkalan.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b"
          style={{ background: 'linear-gradient(135deg, #009345, #00b356)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Edit Pangkalan</h1>
            <p className="text-green-100 text-xs">Perbarui informasi pangkalan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Pangkalan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input id="edit-nama-pangkalan" type="text" value={nama}
                onChange={e => setNama(e.target.value)} required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white"
                onFocus={e => e.currentTarget.style.borderColor = '#009345'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Penanggung Jawab <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input id="edit-penanggung-jawab" type="text" value={penanggungJawab}
                onChange={e => setPenanggungJawab(e.target.value)} required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white"
                onFocus={e => e.currentTarget.style.borderColor = '#009345'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Telepon</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input id="edit-nomor-telepon" type="tel" value={nomorTelepon}
                onChange={e => setNomorTelepon(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white"
                onFocus={e => e.currentTarget.style.borderColor = '#009345'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link href={`/pangkalan/${pangkalan.id}`}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center transition-all hover:bg-slate-100"
              style={{ background: '#f1f5f9', color: '#64748b' }}>Batal</Link>
            <button id="btn-simpan-edit-pangkalan" type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #007a38, #009345)' }}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4" />Simpan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
