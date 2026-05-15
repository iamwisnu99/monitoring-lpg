'use client'

import { useState } from 'react'
import { 
  User, CreditCard, MapPin, ExternalLink, Pencil, Trash2, 
  ChevronLeft, ChevronRight, X, Save, Loader2, AlertCircle
} from 'lucide-react'
import { TabungIcon } from '@/components/icons/TabungIcon'
import { WarungTujuan } from '@/lib/types'
import MapEmbed from '@/components/MapEmbed'
import { deleteWarung, updateWarung } from '@/app/(protected)/distribusi/[id]/actions'

interface Props {
  warungs: WarungTujuan[]
  distribusiId: string
}

export default function WarungList({ warungs: initialWarungs, distribusiId }: Props) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  // State for actions
  const [editingWarung, setEditingWarung] = useState<WarungTujuan | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination logic
  const totalPages = Math.ceil(initialWarungs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentWarungs = initialWarungs.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of list
    const element = document.getElementById('warung-list-header')
    if (element) element.scrollIntoView({ behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus warung ini dari distribusi?')) return
    
    setIsDeleting(id)
    setError(null)
    try {
      await deleteWarung(id, distribusiId)
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus warung')
      setIsDeleting(null)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWarung) return

    setIsSaving(true)
    setError(null)
    try {
      await updateWarung(editingWarung.id, distribusiId, {
        nama_warung: editingWarung.nama_warung,
        nama_penerima: editingWarung.nama_penerima,
        tabung_dimiliki: editingWarung.tabung_dimiliki,
        harga_jual: editingWarung.harga_jual,
        link_lokasi: editingWarung.link_lokasi
      })
      setEditingWarung(null)
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui data warung')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" id="warung-list-container">
      <div id="warung-list-header" className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">
          Warung Tujuan ({initialWarungs.length})
        </h2>
        
        {/* Pagination Info */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="divide-y divide-slate-50">
        {currentWarungs.map((w, idx) => (
          <div key={w.id} className="p-5 group relative">
            {/* Action Buttons Overlay (Desktop) */}
            <div className="absolute top-5 right-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={() => setEditingWarung(w)}
                className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-green-600 hover:border-green-100 transition-all"
                title="Edit Warung"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(w.id)}
                disabled={isDeleting === w.id}
                className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-100 transition-all disabled:opacity-50"
                title="Hapus Warung"
              >
                {isDeleting === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>

            {/* ── Desktop: 2 kolom | Mobile: stack ── */}
            <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-6 lg:items-start space-y-4 lg:space-y-0">

              {/* Kolom Kiri — Nomor, Nama & Info Warung */}
              <div className="space-y-3">
                {/* Nomor + Nama */}
                <div className="flex items-center gap-2.5 mb-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: '#009345' }}
                  >{startIndex + idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate pr-20 lg:pr-0">{w.nama_warung}</h3>
                  </div>
                  
                  {/* Mobile Actions */}
                  <div className="flex lg:hidden items-center gap-1.5">
                    <button
                      onClick={() => setEditingWarung(w)}
                      className="p-1.5 text-slate-400 hover:text-green-600"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={isDeleting === w.id}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Penerima */}
                <div className="flex items-center gap-2 text-sm pl-9">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400 w-16 flex-shrink-0">Penerima:</span>
                  <span className="font-medium text-slate-700">{w.nama_penerima}</span>
                </div>

                <div className="flex items-center gap-2 text-sm pl-9">
                  <TabungIcon size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400 w-16 flex-shrink-0 text-xs">Tabung:</span>
                  <span className="font-medium text-slate-700">
                    {w.tabung_dimiliki !== null ? w.tabung_dimiliki : <span className="text-orange-500 italic text-xs">Belum Diatur</span>}
                  </span>
                </div>

                {/* Harga Jual */}
                <div className="flex items-center gap-2 text-sm pl-9">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400 w-16 flex-shrink-0 text-xs">Harga Jual:</span>
                  <span className="font-medium text-slate-700">
                    {w.harga_jual ? `Rp ${w.harga_jual.toLocaleString('id-ID')}` : <span className="text-orange-500 italic text-xs">Belum Diatur</span>}
                  </span>
                </div>
                
                {/* Link Lokasi */}
                {w.link_lokasi && (
                  <div className="flex items-center gap-2 text-sm pl-9">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-400 w-16 flex-shrink-0">Lokasi:</span>
                    <a
                      href={w.link_lokasi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-medium hover:underline truncate"
                      style={{ color: '#009345' }}
                    >
                      Buka Google Maps
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                )}

                {!w.link_lokasi && (
                  <div className="flex items-center gap-2 text-sm pl-9">
                    <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-slate-300 text-xs italic">Lokasi tidak disertakan</span>
                  </div>
                )}
              </div>

              {/* Kolom Kanan — Embedded Map */}
              {w.link_lokasi ? (
                <div>
                  <MapEmbed url={w.link_lokasi} title={`Lokasi ${w.nama_warung}`} />
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Peta lokasi {w.nama_warung}
                  </p>
                </div>
              ) : (
                <div
                  className="hidden lg:flex items-center justify-center rounded-xl border border-dashed border-slate-200"
                  style={{ height: '360px', background: '#fafafa' }}
                >
                  <div className="text-center">
                    <MapPin className="w-6 h-6 text-slate-200 mx-auto mb-1" />
                    <p className="text-xs text-slate-300">Tidak ada peta</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-5 py-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-center gap-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  currentPage === page 
                    ? 'bg-green-600 text-white shadow-md shadow-green-200' 
                    : 'text-slate-400 hover:bg-white hover:text-slate-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
          >
            Selanjutnya <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingWarung && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Edit Informasi Warung</h3>
              <button onClick={() => setEditingWarung(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nama Warung</label>
                <input
                  type="text"
                  required
                  value={editingWarung.nama_warung}
                  onChange={e => setEditingWarung({...editingWarung, nama_warung: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nama Penerima</label>
                <input
                  type="text"
                  required
                  value={editingWarung.nama_penerima}
                  onChange={e => setEditingWarung({...editingWarung, nama_penerima: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tabung Dimiliki</label>
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  min="0"
                  value={editingWarung.tabung_dimiliki || ''}
                  onChange={e => setEditingWarung({...editingWarung, tabung_dimiliki: e.target.value ? parseInt(e.target.value) : null})}
                  onKeyDown={(e) => {
                    if (['e', 'E', '+', '-', ','].includes(e.key)) e.preventDefault()
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Harga Jual</label>
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  min="0"
                  value={editingWarung.harga_jual || ''}
                  onChange={e => setEditingWarung({...editingWarung, harga_jual: e.target.value ? parseInt(e.target.value) : 0})}
                  onKeyDown={(e) => {
                    if (['e', 'E', '+', '-', ','].includes(e.key)) e.preventDefault()
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Link Google Maps (Opsional)</label>
                <input
                  type="url"
                  value={editingWarung.link_lokasi}
                  onChange={e => setEditingWarung({...editingWarung, link_lokasi: e.target.value})}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition-all text-sm"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingWarung(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #007a38, #009345)' }}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
