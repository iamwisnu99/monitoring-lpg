'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteWarung(warungId: string, distribusiId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('warung_tujuan')
    .delete()
    .eq('id', warungId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/distribusi/${distribusiId}`)
  return { success: true }
}

export async function updateWarung(
  warungId: string,
  distribusiId: string,
  data: {
    nama_warung: string
    nama_penerima: string
    tabung_dimiliki: number | null
    harga_jual: number
    link_lokasi: string
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('warung_tujuan')
    .update(data)
    .eq('id', warungId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/distribusi/${distribusiId}`)
  return { success: true }
}
