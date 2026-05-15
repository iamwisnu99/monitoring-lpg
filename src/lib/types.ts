export type Database = {
  public: {
    Tables: {
      pangkalan: {
        Row: {
          id: string
          nama_pangkalan: string
          penanggung_jawab: string
          nomor_telepon: string | null
          user_id: string
          nama_agen: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nama_pangkalan: string
          penanggung_jawab: string
          nomor_telepon?: string | null
          user_id: string
          nama_agen?: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nama_pangkalan?: string
          penanggung_jawab?: string
          nomor_telepon?: string | null
          user_id?: string
          nama_agen?: string
          parent_id?: string | null
          created_at?: string
        }
      }
      distribusi: {
        Row: {
          id: string
          pangkalan_id: string
          pengirim: string
          tanggal_kirim: string
          created_at: string
        }
        Insert: {
          id?: string
          pangkalan_id: string
          pengirim: string
          tanggal_kirim: string
          created_at?: string
        }
        Update: {
          id?: string
          pangkalan_id?: string
          pengirim?: string
          tanggal_kirim?: string
          created_at?: string
        }
      }
      warung_tujuan: {
        Row: {
          id: string
          distribusi_id: string
          nama_warung: string
          nama_penerima: string
          tabung_dimiliki: number | null
          harga_jual: number
          link_lokasi: string
          created_at: string
        }
        Insert: {
          id?: string
          distribusi_id: string
          nama_warung: string
          nama_penerima: string
          tabung_dimiliki?: number | null
          harga_jual?: number
          link_lokasi: string
          created_at?: string
        }
        Update: {
          id?: string
          distribusi_id?: string
          nama_warung?: string
          nama_penerima?: string
          tabung_dimiliki?: number | null
          harga_jual?: number
          link_lokasi?: string
          created_at?: string
        }
      }
    }
  }
}

export type Pangkalan = Database['public']['Tables']['pangkalan']['Row']
export type Distribusi = Database['public']['Tables']['distribusi']['Row']
export type WarungTujuan = Database['public']['Tables']['warung_tujuan']['Row']

export type DistribusiWithWarung = Distribusi & {
  warung_tujuan: WarungTujuan[]
  pangkalan?: Pangkalan
}
