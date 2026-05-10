'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Loader2, X, AlertTriangle } from 'lucide-react'

interface Props {
  distribusiId: string
  pangkalanId: string
  pengirim: string
}

export default function DeleteDistribusiButton({ distribusiId, pangkalanId, pengirim }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: deleteError } = await supabase.from('distribusi').delete().eq('id', distribusiId)
    if (deleteError) {
      setError('Gagal menghapus distribusi.')
      setLoading(false)
      return
    }
    router.push(pangkalanId ? `/pangkalan/${pangkalanId}` : '/distribusi')
    router.refresh()
  }

  return (
    <>
      <button
        id="btn-delete-distribusi"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-red-50 text-red-500 border border-red-100"
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline">Hapus</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex justify-end mb-1">
              <button onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: '#fef2f2' }}>
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">Hapus Distribusi?</h3>
              <p className="text-slate-500 text-sm mb-1 leading-relaxed">
                Distribusi oleh <strong className="text-slate-700">"{pengirim}"</strong> beserta semua data warung tujuannya akan dihapus.
              </p>
              <p className="text-xs text-red-400 mb-5">Tindakan ini tidak dapat dibatalkan.</p>

              {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

              <button id="btn-konfirmasi-delete-distribusi" onClick={handleDelete} disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 mb-3 hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Menghapus...</> : <><Trash2 className="w-4 h-4" />Ya, Hapus</>}
              </button>
              <button onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
