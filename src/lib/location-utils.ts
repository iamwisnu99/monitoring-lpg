/**
 * Menghitung jarak antara dua koordinat menggunakan rumus Haversine (hasil dalam KM)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius bumi dalam km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Ekstraksi koordinat dari URL Google Maps
 * Mendukung format: 
 * - .../search/lat,lng
 * - .../@lat,lng
 * - .../place/.../@lat,lng
 */
export function extractCoordsFromUrl(url: string | null): { lat: number; lng: number } | null {
  if (!url) return null
  
  try {
    // 1. Prioritas: Cari pola @lat,lng (format standar Google Maps)
    const atMatch = url.match(/@([-+]?[\d.]+),([-+]?[\d.]+)/)
    if (atMatch) {
      const lat = parseFloat(atMatch[1])
      const lng = parseFloat(atMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng }
    }

    // 2. Cari pola !3dlat!4dlng (format dalam URL place)
    const bangMatch = url.match(/!3d([-+]?[\d.]+)!4d([-+]?[\d.]+)/)
    if (bangMatch) {
      const lat = parseFloat(bangMatch[1])
      const lng = parseFloat(bangMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng }
    }

    // 3. Cari pola q=lat,lng atau query=lat,lng
    const queryMatch = url.match(/[?&](?:q|query)=([-+]?[\d.]+),([-+]?[\d.]+)/)
    if (queryMatch) {
      const lat = parseFloat(queryMatch[1])
      const lng = parseFloat(queryMatch[2])
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng }
    }

    // 5. Jurus Terakhir: Cari pola angka yang sangat mirip koordinat di mana saja dalam URL
    // Pola: angka desimal, koma, angka desimal (khusus untuk rentang koordinat Indonesia)
    // Lat: -11 s/d 6, Lng: 95 s/d 141
    const universalRegex = /([-+]?[\d.]+),([-+]?[\d.]+)/g
    let match
    while ((match = universalRegex.exec(url)) !== null) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) {
        return { lat, lng }
      }
    }
  } catch (e) {
    console.error('Gagal ekstraksi koordinat:', e)
  }
  
  return null
}

// ─── State internal untuk deteksi kecepatan antar-reading ────────────────────
let _lastReading: { lat: number; lng: number; ts: number } | null = null

/**
 * Deteksi lokasi palsu — berlapis 7 lapisan pemeriksaan.
 *
 * Lapisan 1-3 : Properti eksplisit (webdriver, mocked flag, accuracy = 0)
 * Lapisan 4   : Timestamp beku — Chrome DevTools override & sebagian ekstensi
 *               menggunakan timestamp statis yang tidak berubah
 * Lapisan 5   : Altitude anomali — spoofer biasanya tidak mengisi altitude
 *               atau mengisi angka sempurna tanpa noise
 * Lapisan 6   : Kecepatan tidak mungkin — teleportasi > 500 km/h antar-reading
 * Lapisan 7   : Koordinat di luar Indonesia — kemungkinan salah set lokasi
 *
 * @returns true jika lokasi diduga palsu
 */
export function isMockLocation(position: GeolocationPosition): boolean {
  const coords = position.coords as any

  // ── Lapisan 1: Selenium / Puppeteer / browser headless ──────────────────
  if (navigator.webdriver) return true

  // ── Lapisan 2: Flag eksplisit dari ekstensi tertentu ────────────────────
  if (coords.mocked || (position as any).mocked) return true

  // ── Lapisan 3: Akurasi persis 0 = lokasi statis buatan ──────────────────
  if (coords.accuracy === 0) return true

  // ── Lapisan 4: Timestamp beku (Chrome DevTools & banyak ekstensi) ────────
  // getCurrentPosition yang legit selalu menghasilkan timestamp ~= Date.now()
  // DevTools / ekstensi sering mengembalikan timestamp yang sudah usang (> 30 detik)
  const ageMs = Date.now() - position.timestamp
  if (ageMs > 30_000) return true   // timestamp lebih dari 30 detik yang lalu

  // ── Lapisan 5: Altitude anomali ──────────────────────────────────────────
  // GPS nyata hampir selalu menyertakan altitude (meski tidak akurat).
  // Banyak spoofer mengisi null atau angka bulat sempurna tanpa noise.
  if (coords.altitude !== null && coords.altitude !== undefined) {
    const alt = coords.altitude as number
    // Altitude yang persis bulat (0, 100, 200, …) tanpa desimal sangat mencurigakan
    if (Number.isInteger(alt) && Math.abs(alt) > 0 && alt % 10 === 0) return true
  }

  // ── Lapisan 6: Kecepatan tidak mungkin (teleportasi) ────────────────────
  // Manusia tidak bisa berpindah > 500 km/h tanpa naik pesawat
  // (dan bahkan pesawat tidak wajar untuk konteks distribusi LPG lokal)
  const MAX_SPEED_MS = 500 / 3.6 // 500 km/h dalam meter/detik ≈ 138.9 m/s
  const { latitude: lat, longitude: lng } = position.coords
  if (_lastReading) {
    const dtSec = (position.timestamp - _lastReading.ts) / 1000
    if (dtSec > 0 && dtSec < 300) { // hanya cek jika dalam 5 menit terakhir
      const distM = calculateDistance(_lastReading.lat, _lastReading.lng, lat, lng) * 1000
      const speed = distM / dtSec // meter/detik
      if (speed > MAX_SPEED_MS) return true
    }
  }
  // Simpan reading terakhir
  _lastReading = { lat, lng, ts: position.timestamp }

  // ── Lapisan 7: Di luar wilayah Indonesia ────────────────────────────────
  // Koordinat Indonesia: Lat -11 s/d +6, Lng 95 s/d 141
  // Jika lokasi ada di London atau Tokyo, hampir pasti spoofing
  const INDONESIA = { latMin: -11, latMax: 6, lngMin: 95, lngMax: 141 }
  if (
    lat < INDONESIA.latMin || lat > INDONESIA.latMax ||
    lng < INDONESIA.lngMin || lng > INDONESIA.lngMax
  ) return true

  return false
}
