'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerProps {
  id?: string
  value: string        // format: YYYY-MM-DD
  onChange: (val: string) => void
  label?: string
  required?: boolean
  placeholder?: string
}

const MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
]
const DAYS_ID = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

function parseYMD(str: string) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

function toYMD(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

export default function DatePicker({ id, value, onChange, label, required, placeholder }: DatePickerProps) {
  const parsed = parseYMD(value)
  const today = new Date()

  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth())
  const ref = useRef<HTMLDivElement>(null)

  // Tutup saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Hitung hari dalam bulan
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  const selectDay = (day: number) => {
    onChange(toYMD(viewYear, viewMonth, day))
    setOpen(false)
  }

  // Format tampilan
  const displayValue = parsed
    ? `${parsed.day} ${MONTHS_ID[parsed.month]} ${parsed.year}`
    : ''

  const isSelected = (day: number) =>
    parsed?.day === day && parsed?.month === viewMonth && parsed?.year === viewYear

  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear

  return (
    <div ref={ref} className="relative">
      {/* Input display */}
      <div
        id={id}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer select-none transition-all"
        style={{
          background: '#f8fafc',
          borderColor: open ? '#009345' : '#e2e8f0',
          boxShadow: open ? '0 0 0 3px rgba(0,147,69,0.1)' : 'none',
        }}
      >
        <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: open ? '#009345' : '#94a3b8' }} />
        <span className={`flex-1 text-sm ${displayValue ? 'text-slate-800' : 'text-slate-400'}`}>
          {displayValue || placeholder || 'Pilih tanggal'}
        </span>
        <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </div>

      {/* Dropdown kalender */}
      {open && (
        <div
          className="absolute left-0 z-50 mt-1.5 rounded-xl border border-slate-200 overflow-hidden animate-fade-in"
          style={{
            background: '#ffffff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            minWidth: '280px',
          }}
        >
          {/* Header navigasi bulan */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {MONTHS_ID[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Nama hari */}
          <div className="grid grid-cols-7 px-3 pt-2">
            {DAYS_ID.map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Grid tanggal */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {/* Spacer untuk hari pertama */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`sp-${i}`} />
            ))}

            {/* Tanggal */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const selected = isSelected(day)
              const todayMark = isToday(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className="relative flex items-center justify-center h-8 w-full rounded-lg text-sm transition-all duration-150"
                  style={{
                    background: selected ? '#009345' : 'transparent',
                    color: selected ? '#ffffff' : todayMark ? '#009345' : '#374151',
                    fontWeight: selected || todayMark ? '700' : '400',
                  }}
                  onMouseEnter={e => {
                    if (!selected) e.currentTarget.style.background = '#f0fdf4'
                  }}
                  onMouseLeave={e => {
                    if (!selected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {day}
                  {todayMark && !selected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tombol Hari Ini */}
          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={() => {
                setViewYear(today.getFullYear())
                setViewMonth(today.getMonth())
                selectDay(today.getDate())
              }}
              className="w-full py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: '#f0fdf4', color: '#009345' }}
            >
              Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
