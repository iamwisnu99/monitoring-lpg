'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Mail, CheckCircle2, Loader2, RefreshCw, AlertCircle, X, ArrowLeft
} from 'lucide-react'

export default function KonfirmasiEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const code = searchParams.get('code') || ''

  const [checking, setChecking] = useState(false)
  const [resending, setResending] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [exchanging, setExchanging] = useState(!!code)

  // ── Handle PKCE flow: ?code= dari link email Supabase ────────────────────
  useEffect(() => {
    if (!code) return
    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (!error) {
          router.replace('/login?verified=1')
        } else {
          setExchanging(false)
        }
      })
      .catch(() => setExchanging(false))
  }, [code, router])

  // ── Auto-detect via auth state change ────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Dengarkan event SIGNED_IN, TOKEN_REFRESHED, atau USER_UPDATED (saat email terverifikasi)
      if (
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') &&
        session?.user?.email_confirmed_at
      ) {
        router.push('/login?verified=1')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleCekKonfirmasi = async () => {
    setChecking(true)
    const supabase = createClient()

    // 1. Coba ambil session yang sudah ada (mungkin sudah diupdate oleh tab lain)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email_confirmed_at) {
      router.push('/login?verified=1')
      return
    }

    // 2. Jika belum, coba refresh session untuk memaksa ambil data terbaru dari server
    // (Bekerja jika sudah ada session di tab ini/localStorage)
    const { data: refreshData } = await supabase.auth.refreshSession()
    if (refreshData?.user?.email_confirmed_at) {
      router.push('/login?verified=1')
      return
    }

    // 3. Terakhir coba getUser (memanggil API Supabase)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email_confirmed_at) {
      router.push('/login?verified=1')
      return
    }

    setChecking(false)
    setShowModal(true)
  }

  const handleKirimUlang = async () => {
    if (resendCooldown > 0 || !email) return
    setResending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (!error) {
      setResendSuccess(true)
      setResendCooldown(60)
      setTimeout(() => setResendSuccess(false), 4000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">

      {/* Loading saat exchange PKCE code */}
      {exchanging ? (
        <div className="text-center animate-fade-in">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: '#009345' }} />
          <p className="text-slate-500 text-sm">Memverifikasi email Anda...</p>
        </div>
      ) : (
        <div className="w-full max-w-sm mx-4 animate-fade-in">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-5 border-b border-slate-100 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                style={{ background: '#dcfce7' }}>
                <Mail className="w-7 h-7" style={{ color: '#009345' }} />
              </div>
              <h1 className="text-lg font-bold text-slate-800 mb-1">Verifikasi Email Anda</h1>
              <p className="text-slate-400 text-sm">Link konfirmasi dikirim ke</p>
              <p className="font-semibold text-slate-700 text-sm mt-0.5 break-all">
                {email || 'alamat email Anda'}
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
              <div className="rounded-xl p-3.5 mb-5 text-sm"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="text-slate-600 leading-relaxed">
                  📬 Buka email Anda dan klik <strong>link konfirmasi</strong> dari Pertamina, lalu kembali ke sini.
                </p>
              </div>

              {/* Tombol cek */}
              <button
                id="btn-cek-konfirmasi"
                onClick={handleCekKonfirmasi}
                disabled={checking}
                className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mb-3"
                style={{ background: 'linear-gradient(135deg, #007a38, #009345)', boxShadow: '0 2px 8px rgba(0,147,69,0.25)' }}
              >
                {checking
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengecek...</>
                  : <><CheckCircle2 className="w-4 h-4" /> Saya sudah konfirmasi</>
                }
              </button>

              {/* Kirim ulang */}
              <button
                id="btn-kirim-ulang-top"
                onClick={handleKirimUlang}
                disabled={resending || resendCooldown > 0 || !email}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#f8fafc', color: '#009345', border: '1px solid #e2e8f0' }}
              >
                {resending
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengirim...</>
                  : resendCooldown > 0
                    ? <><RefreshCw className="w-3.5 h-3.5" /> Kirim ulang ({resendCooldown}s)</>
                    : <><RefreshCw className="w-3.5 h-3.5" /> Kirim Ulang Email</>
                }
              </button>

              {resendSuccess && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-sm animate-fade-in"
                  style={{ color: '#009345' }}>
                  <CheckCircle2 className="w-4 h-4" />
                  Email berhasil dikirim ulang!
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <Link href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke Login
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-slate-400 text-xs mt-5">
            © {new Date().getFullYear()} Pertamina — Monitoring LPG 3Kg
          </p>
        </div>
      )}

      {/* Modal — Email Belum Terverifikasi */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex justify-end mb-1">
              <button onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: '#fef3c7' }}>
                <AlertCircle className="w-7 h-7" style={{ color: '#d97706' }} />
              </div>

              <h3 className="text-base font-bold text-slate-800 mb-2">Email Belum Terverifikasi</h3>
              <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                Email <strong className="text-slate-700">{email}</strong> belum dikonfirmasi.
                Silakan klik link di email terlebih dahulu.
              </p>

              <button
                id="btn-kirim-ulang-modal"
                onClick={async () => { await handleKirimUlang(); setShowModal(false) }}
                disabled={resending || resendCooldown > 0 || !email}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 mb-3 hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #007a38, #009345)' }}
              >
                {resending
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengirim...</>
                  : resendCooldown > 0
                    ? `Kirim ulang dalam ${resendCooldown}s`
                    : <><RefreshCw className="w-3.5 h-3.5" /> Kirim Ulang Email</>
                }
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
