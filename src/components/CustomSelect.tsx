'use client'

import { useState, useRef, useEffect, useId, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  icon?: React.ReactNode
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  className = '',
  icon,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const uid = useId()

  const selected = options.find(o => o.value === value)

  /** Hitung posisi panel relatif terhadap viewport */
  const updatePanelPosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow

    setPanelStyle({
      position: 'fixed',
      left: rect.left,
      width: Math.max(rect.width, 180),
      zIndex: 99999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    })
  }, [])

  const handleOpen = () => {
    updatePanelPosition()
    setOpen(prev => !prev)
  }

  // Tutup saat klik di luar, scroll, resize, atau Escape
  useEffect(() => {
    if (!open) return
    function close(e: MouseEvent) {
      const panel = document.querySelector(`[data-select-panel="${uid}"]`)
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        !panel?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function closeAny() { setOpen(false) }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }

    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', closeAny, true)
    window.addEventListener('resize', closeAny)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', closeAny, true)
      window.removeEventListener('resize', closeAny)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, uid])

  const panel = open ? (
    <div data-select-panel={uid} style={panelStyle}>
      <style>{`
        @keyframes csIn {
          from { opacity:0; transform:translateY(-6px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
          animation: 'csIn 0.15s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '6px 0', maxHeight: '256px', overflowY: 'auto' }}>
          {options.map((opt) => {
            const isActive = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: 'none',
                  outline: 'none',
                  background: isActive ? '#f0fdf4' : 'transparent',
                  color: isActive ? '#15803d' : '#334155',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'background 0.1s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </span>
                {isActive && <Check style={{ width: 14, height: 14, flexShrink: 0, color: '#16a34a' }} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={handleOpen}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-150 focus:outline-none select-none"
        style={{
          background: open ? '#f0fdf4' : '#ffffff',
          borderColor: open ? '#22c55e' : '#e2e8f0',
          color: '#334155',
          boxShadow: open
            ? '0 0 0 3px rgba(34,197,94,0.12), 0 1px 2px rgba(0,0,0,0.05)'
            : '0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {icon && <span style={{ flexShrink: 0, color: '#94a3b8', display: 'flex' }}>{icon}</span>}
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selected ? '#1e293b' : '#94a3b8',
          }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          style={{
            width: 16,
            height: 16,
            flexShrink: 0,
            color: '#94a3b8',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {/* Panel via portal → tidak ter-clip oleh z-index Leaflet map */}
      {typeof document !== 'undefined' && createPortal(panel, document.body)}
    </div>
  )
}
