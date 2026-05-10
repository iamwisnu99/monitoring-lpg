import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditPangkalanClient from './EditPangkalanClient'

interface Props { params: Promise<{ id: string }> }

export default async function EditPangkalanPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pangkalan } = await supabase
    .from('pangkalan').select('*').eq('id', id).eq('user_id', user!.id).single()

  if (!pangkalan) notFound()

  return <EditPangkalanClient pangkalan={pangkalan} />
}
