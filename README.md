# Monitoring Distribusi LPG 3Kg

Aplikasi web fullstack untuk memantau dan mengelola distribusi LPG 3Kg berbasis **Next.js 16** dan **Supabase**. Dirancang untuk agen/pangkalan yang ingin mencatat distribusi ke warung penerima secara terstruktur.

---

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Struktur Database](#struktur-database)
- [Struktur Project](#struktur-project)
- [Setup Lokal](#setup-lokal)
- [Konfigurasi Supabase](#konfigurasi-supabase)
- [Deploy ke Netlify](#deploy-ke-netlify)

---

## Fitur

**Autentikasi**
- Register akun baru dengan verifikasi email
- Login / logout berbasis session (Supabase Auth)
- Halaman konfirmasi email dengan PKCE flow

**Manajemen Pangkalan**
- Tambah, edit, dan hapus pangkalan
- Detail pangkalan: profil, nomor telepon, penanggung jawab, nama agen
- Daftar distribusi per pangkalan dengan nama warung sebagai chip navigasi
- Pagination di daftar distribusi

**Distribusi**
- Tambah distribusi: satu entri distribusi dapat mencakup banyak warung tujuan
- Field pengirim mendukung teks panjang (lebih dari satu nama)
- Setiap warung tujuan memiliki: nama warung, nama penerima, NIK (16 digit), dan link lokasi
- Detail distribusi menampilkan informasi pangkalan, pengirim, dan tanggal pencatatan

**Dashboard Distribusi**
- Grid kartu warung penerima dari seluruh pangkalan (format seperti e-commerce)
- Filter berdasarkan nama warung dan asal pangkalan

**Peta Lokasi (Embedded Maps)**
- Mendukung URL Google Maps panjang maupun URL pendek (`maps.app.goo.gl`)
- Resolusi URL pendek dilakukan server-side melalui API route `/api/resolve-maps`
- Tampilan 2 kolom di desktop: informasi warung (kiri) dan peta tersemat (kanan)

**Monitoring**
- Halaman monitoring untuk melihat seluruh data distribusi lintas pangkalan

**Keamanan**
- Row Level Security (RLS) Supabase — data terisolasi per pengguna
- Content Security Policy (CSP) dikonfigurasi untuk iframe Google Maps

---

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Language | TypeScript |
| Deploy | Netlify (`@netlify/plugin-nextjs`) |

---

## Struktur Database

Jalankan file `supabase-setup.sql` di SQL Editor Supabase untuk membuat semua tabel sekaligus.

| Tabel | Kolom Utama |
|-------|-------------|
| `pangkalan` | `id`, `user_id`, `nama_pangkalan`, `penanggung_jawab`, `nomor_telepon`, `nama_agen`, `created_at` |
| `distribusi` | `id`, `pangkalan_id`, `pengirim`, `tanggal_kirim`, `created_at` |
| `warung_tujuan` | `id`, `distribusi_id`, `nama_warung`, `nama_penerima`, `nik`, `link_lokasi`, `created_at` |

Semua tabel menggunakan Row Level Security. Pengguna hanya dapat mengakses data miliknya sendiri melalui relasi ke kolom `user_id`.

---

## Struktur Project

```
src/
├── app/
│   ├── (protected)/              # Halaman yang memerlukan autentikasi
│   │   ├── dashboard/            # Dashboard ringkasan
│   │   ├── pangkalan/            # Daftar & detail pangkalan
│   │   │   ├── tambah/           # Form tambah pangkalan
│   │   │   └── [id]/
│   │   │       ├── edit/         # Form edit pangkalan
│   │   │       └── distribusi/
│   │   │           └── tambah/   # Form tambah distribusi + warung
│   │   ├── distribusi/           # Dashboard distribusi (grid warung)
│   │   │   └── [id]/             # Detail distribusi + peta
│   │   └── monitoring/           # Monitoring lintas pangkalan
│   ├── api/
│   │   └── resolve-maps/         # API untuk resolusi URL Google Maps pendek
│   ├── auth/
│   │   └── callback/             # Handler PKCE untuk konfirmasi email
│   ├── konfirmasi-email/         # Halaman tunggu verifikasi email
│   ├── login/
│   └── register/
├── components/
│   ├── MapEmbed.tsx              # Komponen peta tersemat (client)
│   ├── DatePicker.tsx            # Komponen pemilih tanggal kustom
│   ├── DeletePangkalanButton.tsx # Tombol hapus pangkalan dengan konfirmasi
│   └── DeleteDistribusiButton.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase browser client
│   │   └── server.ts             # Supabase server client
│   └── types.ts                  # TypeScript types
└── proxy.ts                      # Auth middleware (Next.js 16)
```

---

## Setup Lokal

**Prasyarat:** Node.js 18+, npm

### 1. Clone dan Install

```bash
git clone <url-repository>
cd monitoring-agen
npm install
```

### 2. Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Jalankan

```bash
npm run dev
```

Buka `http://localhost:3000`

---

## Konfigurasi Supabase

### Membuat Database

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** → jalankan seluruh isi `supabase-setup.sql`
3. Buka **Project Settings → API** → salin `Project URL` dan `anon key` ke `.env.local`

### Konfigurasi Auth

Di **Supabase → Authentication → URL Configuration**, tambahkan:

- **Site URL**: `http://localhost:3000` (untuk lokal) atau URL produksi
- **Redirect URLs**:
  ```
  http://localhost:3000/auth/callback
  https://domain-produksi.com/auth/callback
  ```

Tanpa konfigurasi redirect URL, verifikasi email akan gagal karena Supabase tidak mengenali tujuan redirect setelah user klik link konfirmasi.

### Template Email (Opsional)

Template email kustom tersedia di folder `email-templates/`. Untuk menggunakannya:

1. Buka **Authentication → Email Templates → Confirm signup**
2. Isi **Subject**: `Konfirmasi Email Anda`
3. Salin seluruh isi `email-templates/konfirmasi-email.html` ke kolom **Body**
4. Pastikan template mengandung `{{ .ConfirmationURL }}` sebagai href tombol konfirmasi
5. Klik **Save**

---

## Deploy ke Netlify

### Via Netlify UI

1. Push repository ke GitHub/GitLab/Bitbucket
2. Buka [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
3. Pilih repository — Netlify akan membaca `netlify.toml` secara otomatis
4. Tambahkan environment variables di **Site Settings → Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
5. Klik **Deploy site**

### Via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify link

netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://xxxx.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGci..."

netlify deploy --prod --build
```

### Setelah Deploy

Update **Supabase → Authentication → URL Configuration** dengan URL Netlify yang diperoleh:

```
https://nama-site.netlify.app/auth/callback
```

---

## Catatan Teknis

**Resolusi URL Google Maps pendek**

URL pendek (`maps.app.goo.gl/...`) tidak dapat di-embed langsung di iframe. API route `/api/resolve-maps` melakukan redirect server-side menggunakan `User-Agent` mobile untuk mengekstrak koordinat dari URL akhir, kemudian menghasilkan URL embed yang valid.

**PKCE Flow Supabase**

Saat pengguna mengklik link konfirmasi di email, Supabase meredirect ke `/auth/callback?code=...`. Route handler di `src/app/auth/callback/route.ts` memanggil `exchangeCodeForSession(code)` untuk menukar kode dengan session aktif, lalu meredirect ke halaman login dengan status berhasil.

**Migrasi Database**

Jika tabel `pangkalan` sudah ada sebelum kolom `nomor_telepon` ditambahkan, jalankan perintah berikut di SQL Editor:

```sql
ALTER TABLE public.pangkalan ADD COLUMN IF NOT EXISTS nomor_telepon TEXT;
```
