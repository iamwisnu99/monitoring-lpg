'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Building2 } from 'lucide-react'
import { registerAction } from './actions'

export default function RegisterPage() {
  const router = useRouter()
  const [namaAgen, setNamaAgen] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!namaAgen.trim()) {
      setError('Nama agen wajib diisi.')
      return
    }
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    setLoading(true)
    const result = await registerAction({ namaAgen: namaAgen.trim(), email, password })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    router.push(`/konfirmasi-email?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-8">
      <div className="w-full max-w-sm mx-4 animate-fade-in">

        {/* Card — tanpa logo, langsung form */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-5 border-b border-slate-100">
            <h1 className="text-xl font-bold text-slate-800 mb-0.5">Buat Akun Baru</h1>
            <p className="text-slate-400 text-sm">Daftar untuk mulai menggunakan sistem</p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">

              {/* Nama Agen */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Nama Agen <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    id="reg-nama-agen"
                    type="text"
                    value={namaAgen}
                    onChange={(e) => setNamaAgen(e.target.value)}
                    required
                    placeholder="Contoh: Agen LPG Pak Budi"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white"
                    onFocus={e => e.currentTarget.style.borderColor = '#009345'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Email <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white"
                    onFocus={e => e.currentTarget.style.borderColor = '#009345'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Password <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white"
                    onFocus={e => e.currentTarget.style.borderColor = '#009345'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Konfirmasi Password <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    id="reg-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Ulangi password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white"
                    onFocus={e => e.currentTarget.style.borderColor = '#009345'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-register"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                style={{ background: 'linear-gradient(135deg, #007a38, #009345)', boxShadow: '0 2px 8px rgba(0,147,69,0.25)' }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Mendaftar...</> : 'Daftar Sekarang'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-5">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: '#009345' }}>
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-5">
          © {new Date().getFullYear()} Kemitraan Agen | All Right Reserved
        </p>
      </div>
    </div>
  )
}
