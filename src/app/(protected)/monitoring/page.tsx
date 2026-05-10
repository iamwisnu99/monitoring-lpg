import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import MonitoringClient from './MonitoringClient'

export const metadata: Metadata = {
  title: 'Monitoring Admin',
  description: 'Pantau seluruh aktivitas distribusi LPG 3Kg. Export data ke Excel atau PDF.',
  openGraph: { title: 'Monitoring Admin — Monitoring Distribusi LPG 3Kg' },
}

export default async function MonitoringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: distribusiData } = await supabase
    .from('distribusi')
    .select(`
      *,
      pangkalan!inner(id, nama_pangkalan, penanggung_jawab, user_id),
      warung_tujuan(*)
    `)
    .eq('pangkalan.user_id', user!.id)
    .order('tanggal_kirim', { ascending: false })

  return <MonitoringClient data={distribusiData || []} />
}
