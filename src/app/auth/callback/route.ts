import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * /auth/callback — handler untuk PKCE flow Supabase
 *
 * Dipanggil setelah user klik link konfirmasi email.
 * Supabase meredirect ke sini dengan ?code=... yang harus
 * ditukar dengan session menggunakan exchangeCodeForSession().
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Berhasil verifikasi → redirect ke dashboard atau halaman yang dituju
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Gagal exchange → redirect ke login dengan pesan error
    return NextResponse.redirect(
      `${origin}/login?error=confirmation_failed&message=${encodeURIComponent(error.message)}`
    )
  }

  // Tidak ada code → redirect ke login
  return NextResponse.redirect(`${origin}/login`)
}
