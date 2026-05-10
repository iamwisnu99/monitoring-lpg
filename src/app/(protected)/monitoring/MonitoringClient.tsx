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

export default function MonitoringClient({ data }: { data: Distribusi[] }) {
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

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx')
    const rows: any[] = []
    filtered.forEach((d) => {
      d.warung_tujuan.forEach((w) => {
        rows.push({
          'Pangkalan': d.pangkalan.nama_pangkalan,
          'Penanggung Jawab': d.pangkalan.penanggung_jawab,
          'Pengirim': d.pengirim,
          'Tanggal Kirim': new Date(d.tanggal_kirim).toLocaleDateString('id-ID'),
          'Nama Warung': w.nama_warung,
          'Nama Penerima': w.nama_penerima,
          'NIK': w.nik,
          'Link Lokasi': w.link_lokasi,
        })
      })
    })
    const ws = utils.json_to_sheet(rows)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Monitoring LPG')
    writeFile(wb, `monitoring-lpg-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    let y = 15

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Laporan Monitoring Distribusi LPG 3Kg', 14, y)
    y += 6
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120)
    doc.text(`Digenerate: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, y)
    y += 10
    doc.setTextColor(0)

    filtered.forEach((d, i) => {
      if (y > 260) { doc.addPage(); y = 15 }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(`${i + 1}. ${d.pangkalan.nama_pangkalan}`, 14, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Penanggung Jawab: ${d.pangkalan.penanggung_jawab}   |   Pengirim: ${d.pengirim}   |   Tanggal: ${new Date(d.tanggal_kirim).toLocaleDateString('id-ID')}`, 18, y)
      y += 5
      d.warung_tujuan.forEach((w, wi) => {
        if (y > 270) { doc.addPage(); y = 15 }
        doc.text(`  ${wi + 1}. ${w.nama_warung} — ${w.nama_penerima} — NIK: ${w.nik}`, 18, y)
        y += 4
        if (w.link_lokasi) {
          doc.setTextColor(37, 99, 235)
          doc.text(`     ${w.link_lokasi}`, 18, y)
          doc.setTextColor(0)
          y += 4
        }
      })
      y += 4
    })

    doc.save(`monitoring-lpg-${new Date().toISOString().split('T')[0]}.pdf`)
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
