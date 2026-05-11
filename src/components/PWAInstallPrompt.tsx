'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Cek jika sudah terinstall
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    // Cek jika baru saja di-dismiss (dalam 24 jam terakhir)
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at')
    if (dismissedAt) {
      const lastDismissed = parseInt(dismissedAt)
      const now = Date.now()
      const oneDay = 24 * 60 * 60 * 1000
      if (now - lastDismissed < oneDay) return
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Tampilkan banner setelah beberapa detik
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-bounce-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-green-100 p-4 flex items-center justify-between gap-4 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Pasang Aplikasi</h4>
            <p className="text-xs text-slate-500">Install agar lebih cepat & mudah diakses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShow(false)
              localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString())
            }}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-200"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
