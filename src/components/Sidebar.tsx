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
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center px-6 py-5 border-b border-slate-100">
        <Image
          src="/pertamina_logo.png"
          alt="Pertamina"
          width={130}
          height={44}
          className="object-contain"
          priority
        />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                background: isActive ? '#f0fdf4' : 'transparent',
                color: isActive ? '#007a38' : '#64748b',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={{ color: isActive ? '#009345' : '#94a3b8' }}
              />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3" style={{ color: '#009345', opacity: 0.7 }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl bg-slate-50">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#dcfce7' }}>
            <User className="w-4 h-4" style={{ color: '#009345' }} />
          </div>
          <div className="flex-1 min-w-0">
            {namaAgen && (
              <p className="text-xs font-semibold text-slate-700 truncate">{namaAgen}</p>
            )}
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>

        <button
          id="btn-logout"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 transition-all duration-150 hover:text-red-500"
          onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar — hanya hamburger + nama app */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shadow-sm">
        <span className="text-sm font-semibold text-slate-700">Monitoring LPG 3Kg</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-40 w-64 flex flex-col bg-white border-r border-slate-100 shadow-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed top-0 left-0 bottom-0 bg-white border-r border-slate-100 shadow-sm z-30">
        <NavContent />
      </aside>
    </>
  )
}
