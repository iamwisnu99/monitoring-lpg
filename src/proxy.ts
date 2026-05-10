import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy Middleware untuk Next.js 16 (Netlify Compatible)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Response awal
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Pastikan variabel lingkungan ada
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Ambil user (menyegarkan sesi jika perlu)
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Tangani halaman root (/)
  if (pathname === '/') {
    return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url))
  }

  // 2. Tentukan kategori rute
  const isProtectedRoute = ['/dashboard', '/pangkalan', '/distribusi', '/monitoring'].some(path => 
    pathname.startsWith(path)
  )
  const isAuthRoute = ['/login', '/register', '/konfirmasi-email'].some(path => 
    pathname.startsWith(path)
  )

  // 3. Logika Pengalihan
  if (!user && isProtectedRoute) {
    // Belum login & akses halaman rahasia -> Tendang ke Login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    // Sudah login & akses halaman login/regis -> Lempar ke Dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export default middleware

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
