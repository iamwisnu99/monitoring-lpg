import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const namaAgen = user?.user_metadata?.nama_agen as string | undefined

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar userEmail={user!.email || ''} namaAgen={namaAgen} />
      {/* pt-14 untuk mobile navbar (56px), lg:ml-64 untuk desktop sidebar */}
      <main className="lg:ml-64 min-h-screen">
        <div className="px-4 py-5 pt-[72px] lg:pt-8 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

