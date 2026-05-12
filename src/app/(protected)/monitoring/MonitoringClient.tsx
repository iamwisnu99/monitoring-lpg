'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BarChart3, Search, Download, MapPin, User, CreditCard,
  Warehouse, Calendar, ChevronDown, ChevronUp, Truck, FileSpreadsheet, FileText
} from 'lucide-react'

interface WarungTujuan {
  id: string
  distribusi_id: string
  nama_warung: string
  nama_penerima: string
  nik: string
  link_lokasi: string
  created_at: string
}

interface Distribusi {
  id: string
  pengirim: string
  tanggal_kirim: string
  pangkalan: {
    id: string
    nama_pangkalan: string
    penanggung_jawab: string
  }
  warung_tujuan: WarungTujuan[]
}

export default function MonitoringClient({
  data,
  namaAgen,
  userEmail
}: {
  data: Distribusi[],
  namaAgen?: string,
  userEmail?: string
}) {
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((d) =>
      d.pangkalan.nama_pangkalan.toLowerCase().includes(q) ||
      d.pengirim.toLowerCase().includes(q) ||
      d.pangkalan.penanggung_jawab.toLowerCase().includes(q) ||
      d.warung_tujuan.some((w) =>
        w.nama_warung.toLowerCase().includes(q) ||
        w.nama_penerima.toLowerCase().includes(q) ||
        w.nik.includes(q)
      )
    )
  }, [data, search])

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedIds(next)
  }

  const expandAll = () => setExpandedIds(new Set(filtered.map((d) => d.id)))
  const collapseAll = () => setExpandedIds(new Set())

  // Helper untuk mendapatkan base64 image (untuk logo PDF)
  const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  }

  const exportExcel = async () => {
    const ExcelJS = await import('exceljs')
    const { saveAs } = await import('file-saver')

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Laporan Monitoring')

    // 1. Tambahkan Logo
    try {
      const response = await fetch('/pertamina_logo.png')
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const logoId = workbook.addImage({
        buffer: arrayBuffer,
        extension: 'png',
      })
      
      // Lebarkan kolom A dan tinggikan baris 1 untuk ruang logo
      worksheet.getColumn(1).width = 30
      worksheet.getRow(1).height = 120

      // Letakkan logo di sel A1 dengan offset yang pas
      worksheet.addImage(logoId, {
        tl: { col: 0.1, row: 0.1 },
        ext: { width: 110, height: 110 },
        editAs: 'oneCell'
      })
    } catch (e) {
      console.error('Excel Logo Error:', e)
    }

    // 2. Info Header (Disebelah logo, mulai dari baris 1)
    worksheet.mergeCells('B1:H1')
    const titleCell = worksheet.getCell('B1')
    titleCell.value = 'LAPORAN KEMITRAAN AGEN - MONITORING DISTRIBUSI'
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF009345' } }
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 10 }

    // Gunakan baris 2, 3, 4 untuk info agar sejajar dengan tinggi logo di baris 1 yang tinggi
    worksheet.getCell('B2').value = 'Agen:'
    worksheet.getCell('C2').value = namaAgen || 'Admin LPG'
    worksheet.getCell('C2').font = { bold: true }
    
    worksheet.getCell('B3').value = 'Email:'
    worksheet.getCell('C3').value = userEmail || '-'

    worksheet.getCell('B4').value = 'Tanggal:'
    worksheet.getCell('C4').value = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

    // Beri perataan tengah untuk info
    const infoRows = [2, 3, 4]
    infoRows.forEach(r => {
      worksheet.getRow(r).alignment = { vertical: 'middle' }
    })

    // 3. Spasi sebelum tabel
    const startRow = 7

    // 4. Header Tabel
    const headers = ['No', 'Pangkalan', 'Penanggung Jawab', 'Pengirim', 'Tanggal Kirim', 'Nama Warung', 'Nama Penerima', 'NIK', 'Link Lokasi']
    const headerRow = worksheet.getRow(startRow)
    headerRow.values = headers

    // Styling Header
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF009345' }
      }
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // 5. Isi Data
    let currentRow = startRow + 1
    let counter = 1

    filtered.forEach((d) => {
      d.warung_tujuan.forEach((w) => {
        const rowData = [
          counter++,
          d.pangkalan.nama_pangkalan,
          d.pangkalan.penanggung_jawab,
          d.pengirim,
          new Date(d.tanggal_kirim).toLocaleDateString('id-ID'),
          w.nama_warung,
          w.nama_penerima,
          w.nik,
          w.link_lokasi || '-'
        ]
        const row = worksheet.addRow(rowData)

        // Styling Baris Data
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
        })

        // Zebra Striping (Baris Genap)
        if (row.number % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            }
          })
        }
      })
    })

    // 6. Atur Lebar Kolom
    worksheet.columns = [
      { width: 5 },  // No
      { width: 25 }, // Pangkalan
      { width: 20 }, // PJ
      { width: 20 }, // Pengirim
      { width: 15 }, // Tgl
      { width: 25 }, // Warung
      { width: 20 }, // Penerima
      { width: 20 }, // NIK
      { width: 35 }, // Link
    ]

    // 7. Simpan File
    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), `Laporan-Monitoring-Kemitraan-Agen-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    try {
      // Load Logo
      const logoBase64 = await getBase64ImageFromUrl('/pertamina_logo.png')
      // Logo di kiri
      doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20)
    } catch (e) {
      console.error('Failed to load logo', e)
    }

    // Info Agen di samping kanan logo
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(50)
    doc.text(namaAgen || 'Admin LPG', 38, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(userEmail || '-', 38, 23)
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 38, 28)

    // Garis Pemisah Header
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(14, 35, 196, 35)

    // Judul di bawah garis
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(0, 147, 69) // Green Pertamina
    doc.text('LAPORAN KEMITRAAN AGEN - MONITORING DISTRIBUSI', 14, 45)

    let y = 55

    // Table Header Background
    doc.setFillColor(248, 250, 252)
    doc.rect(14, y - 6, 182, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(50)
    doc.text('NO', 16, y - 1)
    doc.text('PANGKALAN / WARUNG', 30, y - 1)
    doc.text('Penerima', 110, y - 1)
    doc.text('NIK', 150, y - 1)
    doc.text('TANGGAL', 175, y - 1)

    y += 8

    let counter = 1
    filtered.forEach((d) => {
      // Check for new page
      if (y > 270) { doc.addPage(); y = 20 }

      // Pangkalan Row (Highlight)
      doc.setFillColor(241, 245, 249)
      doc.rect(14, y - 5, 182, 7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 122, 56)
      doc.text(`${counter++}. PANGKALAN: ${d.pangkalan.nama_pangkalan.toUpperCase()}`, 16, y)
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(new Date(d.tanggal_kirim).toLocaleDateString('id-ID'), 175, y)
      y += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(50)

      d.warung_tujuan.forEach((w, wi) => {
        if (y > 280) { doc.addPage(); y = 20 }

        // Warung Detail
        doc.text(`${wi + 1}`, 20, y)
        doc.text(w.nama_warung, 30, y)
        doc.text(w.nama_penerima, 110, y)
        doc.text(w.nik, 150, y)

        y += 6

        if (w.link_lokasi) {
          doc.setFontSize(7)
          doc.setTextColor(0, 179, 86)
          doc.text(`Lokasi: ${w.link_lokasi}`, 30, y - 1)
          doc.setTextColor(50)
          doc.setFontSize(9)
          y += 5
        }
      })
      y += 4
    })

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('Halaman ' + i + ' dari ' + pageCount, 100, 287, { align: 'center' })
      doc.text('Kemitraan Agen - Sistem Monitoring LPG 3Kg', 14, 287)
    }

    doc.save(`Laporan-Monitoring-LPG-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const totalWarung = filtered.reduce((acc, d) => acc + d.warung_tujuan.length, 0)

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Monitoring Admin</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} distribusi · {totalWarung} warung tujuan
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            id="btn-export-excel"
            onClick={exportExcel}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#d1fae5', color: '#065f46' }}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            id="btn-export-pdf"
            onClick={exportPDF}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#fee2e2', color: '#991b1b' }}
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Search + Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="monitoring-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pangkalan, pengirim, warung, atau NIK..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm outline-none transition-all focus:border-green-600 focus:ring-2 focus:ring-green-100"
            style={{ background: '#ffffff' }}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={expandAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-slate-200"
            style={{ background: '#e2e8f0', color: '#475569' }}>
            <ChevronDown className="w-3.5 h-3.5" />
            Buka Semua
          </button>
          <button onClick={collapseAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-slate-200"
            style={{ background: '#e2e8f0', color: '#475569' }}>
            <ChevronUp className="w-3.5 h-3.5" />
            Tutup
          </button>
        </div>
      </div>

      {/* Data */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((d, idx) => {
            const isExpanded = expandedIds.has(d.id)
            return (
              <div key={d.id} className="rounded-2xl shadow-sm overflow-hidden" style={{ background: '#ffffff' }}>
                {/* Distribusi Header */}
                <button
                  onClick={() => toggleExpand(d.id)}
                  id={`monitoring-item-${d.id}`}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #009345, #00b356)' }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">{d.pangkalan.nama_pangkalan}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#009345' }}>
                        {d.warung_tujuan.length} warung
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <User className="w-3 h-3" /> PJ: {d.pangkalan.penanggung_jawab}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Truck className="w-3 h-3" /> Pengirim: {d.pengirim}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(d.tanggal_kirim).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  }
                </button>

                {/* Warung List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50 animate-fade-in">
                    {d.warung_tujuan.map((w, wi) => (
                      <div key={w.id} className="px-5 py-4 pl-14">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-slate-400 mt-0.5 w-5 flex-shrink-0">{wi + 1}.</span>
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                              <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                              {w.nama_warung}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {w.nama_penerima}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                                <CreditCard className="w-3 h-3" />
                                {w.nik}
                              </p>
                              {w.link_lokasi && (
                                <a href={w.link_lokasi} target="_blank" rel="noopener noreferrer"
                                  className="text-xs flex items-center gap-1 hover:underline"
                                  style={{ color: '#00b356' }}
                                  onClick={(e) => e.stopPropagation()}>
                                  <MapPin className="w-3 h-3" />
                                  Lihat Lokasi
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center shadow-sm" style={{ background: '#ffffff' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#dcfce7' }}>
            <BarChart3 className="w-8 h-8" style={{ color: '#009345' }} />
          </div>
          <h3 className="font-semibold text-slate-700 mb-2">
            {search ? `Tidak ada hasil untuk "${search}"` : 'Belum Ada Data'}
          </h3>
          <p className="text-slate-400 text-sm">
            {search ? 'Coba kata kunci lain' : 'Data distribusi akan muncul di sini setelah ditambahkan'}
          </p>
          {!search && (
            <Link href="/pangkalan" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #009345, #00b356)' }}>
              Kelola Pangkalan
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
