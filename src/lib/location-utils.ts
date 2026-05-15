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

/**
 * Deteksi lokasi palsu (Mock Location / Proxy)
 */
export function isMockLocation(position: GeolocationPosition): boolean {
  // 1. Cek navigator.webdriver (sering aktif pada automasi/browser headless)
  if (navigator.webdriver) return true

  // 2. Cek properti non-standar yang sering disuntikkan ekstensi
  // Beberapa browser/ekstensi menyuntikkan properti 'mocked'
  const coords = position.coords as any
  if (coords.mocked || (position as any).mocked) return true

  // 3. Akurasi yang terlalu sempurna (0) sering kali menandakan lokasi statis buatan
  if (coords.accuracy === 0) return true

  return false
}
