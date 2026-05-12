'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Warehouse,
  Truck,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pangkalan', label: 'Pangkalan', icon: Warehouse },
  { href: '/distribusi', label: 'Distribusi', icon: Truck },
  { href: '/monitoring', label: 'Monitoring', icon: BarChart3 },
]

export default function Sidebar({ userEmail, namaAgen }: { userEmail: string; namaAgen?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center px-6 py-8">
        <Image
          src="/logo_pertamina.png"
          alt="Pertamina"
          width={140}
          height={48}
          className="object-contain"
          priority
        />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 space-y-1.5">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Main Menu</div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group"
              style={{
                background: isActive ? 'linear-gradient(135deg, #009345, #007a38)' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
                boxShadow: isActive ? '0 8px 20px -6px rgba(0,147,69,0.4)' : 'none'
              }}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                style={{ color: isActive ? '#ffffff' : '#94a3b8' }}
              />
              <span className="flex-1">{label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer info di sidebar desktop */}
      <div className="p-6">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Akun Terdaftar</p>
          <p className="text-xs font-bold text-slate-700 truncate mb-0.5">{namaAgen || 'Admin'}</p>
          <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
          <button 
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar Sesi
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* ─── MOBILE TOP BAR ─── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="h-8 w-auto">
          <Image
            src="/logo_pertamina.png"
            alt="Pertamina"
            width={90}
            height={30}
            className="object-contain h-full w-auto"
            priority
          />
        </div>
        
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-10 h-10 rounded-full border-2 border-green-100 p-0.5 transition-all active:scale-90 overflow-hidden bg-slate-50"
          >
            <div className="w-full h-full rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <User className="w-5 h-5" />
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Profil Agen</p>
                  <p className="text-sm font-bold text-slate-800">{namaAgen || 'Admin LPG'}</p>
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                </div>
                <div className="px-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <LogOut className="w-4 h-4" />
                    </div>
                    Keluar Sesi
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── MOBILE BOTTOM NAVIGATION ─── */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-100 shadow-[0_-8px-24px_-12px_rgba(0,0,0,0.1)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
      >
        <nav className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-300 relative ${isActive ? 'flex-1' : 'flex-1'}`}
              >
                <div className={`transition-all duration-300 ${isActive ? '-translate-y-1 scale-110' : ''}`}>
                  <Icon
                    className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-green-600' : 'text-slate-400'}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'text-green-600' : 'text-slate-400 opacity-60'}`}>
                  {label}
                </span>
                {isActive && (
                  <div className="absolute -top-2 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed top-0 left-0 bottom-0 bg-white border-r border-slate-100 shadow-sm z-30 overflow-y-auto">
        <NavContent />
      </aside>
    </>
  )
}
