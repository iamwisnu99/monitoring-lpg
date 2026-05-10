
CREATE TABLE IF NOT EXISTS public.pangkalan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_pangkalan TEXT NOT NULL,
  penanggung_jawab TEXT NOT NULL,
  nomor_telepon TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_agen TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Tabel Distribusi
CREATE TABLE IF NOT EXISTS public.distribusi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pangkalan_id UUID NOT NULL REFERENCES public.pangkalan(id) ON DELETE CASCADE,
  pengirim TEXT NOT NULL,
  tanggal_kirim DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Tabel Warung Tujuan
CREATE TABLE IF NOT EXISTS public.warung_tujuan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  distribusi_id UUID NOT NULL REFERENCES public.distribusi(id) ON DELETE CASCADE,
  nama_warung TEXT NOT NULL,
  nama_penerima TEXT NOT NULL,
  nik TEXT NOT NULL CHECK (length(nik) = 16 AND nik ~ '^[0-9]+$'),
  link_lokasi TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE OR REPLACE VIEW public.profil_agen AS
  SELECT
    u.id                                                         AS user_id,
    u.email                                                      AS email,
    u.raw_user_meta_data ->> 'nama_agen'                        AS nama_agen,
    u.email_confirmed_at IS NOT NULL                            AS email_verified,
    u.created_at                                                 AS terdaftar_sejak
  FROM auth.users u;

GRANT SELECT ON public.profil_agen TO authenticated;

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.pangkalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pangkalan ADD COLUMN IF NOT EXISTS nomor_telepon TEXT;
ALTER TABLE public.distribusi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warung_tujuan ENABLE ROW LEVEL SECURITY;

-- Policies untuk pangkalan
CREATE POLICY "Users can view own pangkalan" ON public.pangkalan
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pangkalan" ON public.pangkalan
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pangkalan" ON public.pangkalan
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pangkalan" ON public.pangkalan
  FOR DELETE USING (auth.uid() = user_id);

-- Policies untuk distribusi
CREATE POLICY "Users can view own distribusi" ON public.distribusi
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pangkalan p
      WHERE p.id = distribusi.pangkalan_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert distribusi for own pangkalan" ON public.distribusi
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pangkalan p
      WHERE p.id = pangkalan_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own distribusi" ON public.distribusi
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.pangkalan p
      WHERE p.id = distribusi.pangkalan_id AND p.user_id = auth.uid()
    )
  );

-- Policies untuk warung_tujuan
CREATE POLICY "Users can view own warung_tujuan" ON public.warung_tujuan
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.distribusi d
      JOIN public.pangkalan p ON p.id = d.pangkalan_id
      WHERE d.id = warung_tujuan.distribusi_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert warung_tujuan for own distribusi" ON public.warung_tujuan
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.distribusi d
      JOIN public.pangkalan p ON p.id = d.pangkalan_id
      WHERE d.id = distribusi_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own warung_tujuan" ON public.warung_tujuan
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.distribusi d
      JOIN public.pangkalan p ON p.id = d.pangkalan_id
      WHERE d.id = warung_tujuan.distribusi_id AND p.user_id = auth.uid()
    )
  );

-- INDEXES untuk performa
CREATE INDEX IF NOT EXISTS idx_pangkalan_user_id     ON public.pangkalan(user_id);
CREATE INDEX IF NOT EXISTS idx_pangkalan_nama_agen   ON public.pangkalan(nama_agen);
CREATE INDEX IF NOT EXISTS idx_distribusi_pangkalan  ON public.distribusi(pangkalan_id);
CREATE INDEX IF NOT EXISTS idx_warung_distribusi     ON public.warung_tujuan(distribusi_id);
CREATE INDEX IF NOT EXISTS idx_distribusi_tanggal    ON public.distribusi(tanggal_kirim DESC);