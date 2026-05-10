'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Truck, Plus, Trash2, Save, Loader2, AlertCircle,
  Store, User, CreditCard, MapPin,
} from 'lucide-react'
import { use } from 'react'
import DatePicker from '@/components/DatePicker'

interface WarungItem {
  id: string
  nama_warung: string
  nama_penerima: string
  nik: string
  link_lokasi: string
}

function generateId() {
  return Math.random().toString(36).substring(2, 11)
}

interface Props {
  params: Promise<{ id: string }>
}

export default function TambahDistribusiPage({ params }: Props) {
  const { id: pangkalanId } = use(params)
  const router = useRouter()

  const [pengirim, setPengirim] = useState('')
  const [tanggalKirim, setTanggalKirim] = useState(new Date().toISOString().split('T')[0])
  const [warungList, setWarungList] = useState<WarungItem[]>([
    { id: generateId(), nama_warung: '', nama_penerima: '', nik: '', link_lokasi: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addWarung = () => {
    setWarungList([...warungList, { id: generateId(), nama_warung: '', nama_penerima: '', nik: '', link_lokasi: '' }])
  }

  const removeWarung = (id: string) => {
    if (warungList.length === 1) return
    setWarungList(warungList.filter((w) => w.id !== id))
  }

  const updateWarung = (id: string, field: keyof WarungItem, value: string) => {
    setWarungList(warungList.map((w) => w.id === id ? { ...w, [field]: value } : w))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    for (const w of warungList) {
      if (!w.nama_warung.trim() || !w.nama_penerima.trim() || !w.nik.trim()) {
        setError('Semua field warung wajib diisi.')
        return
      }
      if (w.nik.length !== 16 || !/^\d+$/.test(w.nik)) {
        setError(`NIK warung "${w.nama_warung}" harus 16 digit angka.`)
        return
      }
    }

    setLoading(true)
    const supabase = createClient()

    // Insert distribusi
    const { data: distribusi, error: distError } = await supabase
      .from('distribusi')
      .insert({ pangkalan_id: pangkalanId, pengirim: pengirim.trim(), tanggal_kirim: tanggalKirim })
      .select()
      .single()

    if (distError || !distribusi) {
      setError('Gagal menyimpan distribusi. Coba lagi.')
      setLoading(false)
      return
    }

    // Insert warung
    const warungInserts = warungList.map((w) => ({
      distribusi_id: distribusi.id,
      nama_warung: w.nama_warung.trim(),
      nama_penerima: w.nama_penerima.trim(),
      nik: w.nik.trim(),
      link_lokasi: w.link_lokasi.trim(),
    }))

    const { error: warungError } = await supabase.from('warung_tujuan').insert(warungInserts)

    if (warungError) {
      setError('Distribusi tersimpan, tapi gagal menyimpan data warung.')
      setLoading(false)
      return
    }

    router.push(`/pangkalan/${pangkalanId}`)
    router.refresh()
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <Link href={`/pangkalan/${pangkalanId}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Detail Pangkalan
      </Link>

      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#ffffff' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b"
          style={{ background: 'linear-gradient(135deg, #009345, #00b356)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Tambah Distribusi</h1>
            <p className="text-green-100 text-xs">Isi data pengiriman LPG</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Distribusi Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="pengirim" className="block text-sm font-medium text-slate-700 mb-1.5">
                Pengirim <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-slate-400 ml-1">(bisa lebih dari satu orang)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  id="pengirim"
                  value={pengirim}
                  onChange={(e) => setPengirim(e.target.value)}
                  required
                  rows={3}
                  placeholder="Contoh: Mas Tio, Bu Sari, Pak Andi"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white resize-y min-h-[80px]"
                  onFocus={e => e.currentTarget.style.borderColor = '#009345'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tanggal Kirim <span className="text-red-500">*</span>
              </label>
              <DatePicker
                id="tanggal_kirim"
                value={tanggalKirim}
                onChange={setTanggalKirim}
                placeholder="Pilih tanggal kirim"
              />
            </div>
          </div>

          {/* Warung List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800 text-sm">
                Warung Tujuan ({warungList.length})
              </h2>
              <button
                type="button"
                id="btn-tambah-warung"
                onClick={addWarung}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: '#dcfce7', color: '#009345' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Warung
              </button>
            </div>

            <div className="space-y-4">
              {warungList.map((warung, idx) => (
                <div key={warung.id} className="rounded-xl border border-slate-200 p-4 relative animate-fade-in"
                  style={{ background: '#f8fafc' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Warung #{idx + 1}
                    </span>
                    {warungList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWarung(warung.id)}
                        className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nama Warung *</label>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          id={`warung-nama-${idx}`}
                          type="text"
                          value={warung.nama_warung}
                          onChange={(e) => updateWarung(warung.id, 'nama_warung', e.target.value)}
                          required
                          placeholder="Nama warung"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all focus:border-green-500 focus:ring-1 focus:ring-green-100 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nama Penerima *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          id={`warung-penerima-${idx}`}
                          type="text"
                          value={warung.nama_penerima}
                          onChange={(e) => updateWarung(warung.id, 'nama_penerima', e.target.value)}
                          required
                          placeholder="Nama penerima"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all focus:border-green-500 focus:ring-1 focus:ring-green-100 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">NIK (16 digit) *</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          id={`warung-nik-${idx}`}
                          type="text"
                          value={warung.nik}
                          onChange={(e) => updateWarung(warung.id, 'nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                          required
                          maxLength={16}
                          placeholder="16 digit NIK"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all focus:border-green-500 focus:ring-1 focus:ring-green-100 bg-white font-mono"
                        />
                      </div>
                      {warung.nik && warung.nik.length !== 16 && (
                        <p className="text-xs text-orange-500 mt-0.5">{warung.nik.length}/16 digit</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Link Lokasi (Google Maps)</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          id={`warung-lokasi-${idx}`}
                          type="url"
                          value={warung.link_lokasi}
                          onChange={(e) => updateWarung(warung.id, 'link_lokasi', e.target.value)}
                          placeholder="https://maps.google.com/..."
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all focus:border-green-500 focus:ring-1 focus:ring-green-100 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              href={`/pangkalan/${pangkalanId}`}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center transition-all hover:bg-slate-100 active:scale-[0.98]"
              style={{ background: '#f1f5f9', color: '#64748b' }}
            >
              Batal
            </Link>
            <button
              id="btn-simpan-distribusi"
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #009345, #00b356)' }}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan Distribusi</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
