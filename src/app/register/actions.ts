'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function registerAction(formData: {
  namaAgen: string
  email: string
  password: string
}) {
  const supabase = await createClient()
  const headerList = await headers()
  
  // Deteksi origin secara dinamis untuk Netlify/Production
  const host = headerList.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const origin = headerList.get('origin') || `${protocol}://${host}`

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/login?verified=1`,
      data: { nama_agen: formData.namaAgen },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
