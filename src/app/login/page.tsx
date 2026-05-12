'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isVerified = searchParams.get('verified') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email atau password salah. Silakan coba lagi.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm mx-4 animate-fade-in">

        {/* Card — logo + form dalam satu grup */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">

          {/* Logo area */}
          <div className="flex flex-col items-center pt-8 pb-5 px-8 border-b border-slate-100">
            <Image
              src="/pertamina_logo.png"
              alt="Pertamina Logo"
              width={120}
              height={40}
              className="object-contain mb-3"
              style={{ height: 'auto' }}
              priority
            />
            <h1 className="text-base font-semibold text-slate-700">Kemitraan Agen</h1>
          </div>

          {/* Form area */}
          <div className="px-8 py-7">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Masuk</h2>
            <p className="text-slate-400 text-sm mb-5">Masukkan email dan password Anda</p>

            {isVerified && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm animate-fade-in"
                style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Email berhasil diverifikasi! Silakan masuk.
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    id="email"
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

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Masukkan password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white"
                    onFocus={e => e.currentTarget.style.borderColor = '#009345'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-login"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                style={{ background: 'linear-gradient(135deg, #007a38, #009345)', boxShadow: '0 2px 8px rgba(0,147,69,0.25)' }}
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Masuk...</> : 'Masuk'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-5">
              Belum punya akun?{' '}
              <Link href="/register" className="font-semibold hover:underline" style={{ color: '#009345' }}>
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-5">
          © {new Date().getFullYear()} Kemitraan Agen | All Rights Reserved
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
