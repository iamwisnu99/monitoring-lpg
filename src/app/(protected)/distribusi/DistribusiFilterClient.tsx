'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import CustomSelect, { type SelectOption } from '@/components/CustomSelect'
import { Search } from 'lucide-react'

interface Props {
  pangkalanList: { id: string; nama_pangkalan: string }[]
  defaultSearch?: string
  defaultPangkalanId?: string
}

export default function DistribusiFilterClient({
  pangkalanList,
  defaultSearch = '',
  defaultPangkalanId = '',
}: Props) {
  const router = useRouter()
  const [pangkalanId, setPangkalanId] = useState(defaultPangkalanId)
  const searchRef = useRef<HTMLInputElement>(null)

  const pangkalanOptions: SelectOption[] = [
    { value: '', label: 'Semua Pangkalan' },
    ...pangkalanList.map(p => ({ value: p.id, label: p.nama_pangkalan })),
  ]

  function buildUrl(search: string, pkId: string) {
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (pkId) params.set('pangkalan_id', pkId)
    return `/distribusi${params.size > 0 ? `?${params}` : ''}`
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = searchRef.current?.value ?? ''
    router.push(buildUrl(q, pangkalanId))
  }

  function handlePangkalanChange(val: string) {
    setPangkalanId(val)
    const q = searchRef.current?.value ?? ''
    router.push(buildUrl(q, val))
  }

  const hasFilter = defaultSearch || defaultPangkalanId

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="flex gap-3 flex-1 min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={searchRef}
            id="search-warung"
            name="q"
            type="text"
            defaultValue={defaultSearch}
            placeholder="Cari nama warung..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm outline-none transition-all bg-white focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #007a38, #009345)' }}
        >
          Cari
        </button>
      </form>

      {/* Pangkalan filter — modern dropdown */}
      <div className="sm:w-56">
        <CustomSelect
          value={pangkalanId}
          onChange={handlePangkalanChange}
          options={pangkalanOptions}
          placeholder="Semua Pangkalan"
        />
      </div>

      {/* Reset */}
      {hasFilter && (
        <button
          type="button"
          onClick={() => {
            setPangkalanId('')
            if (searchRef.current) searchRef.current.value = ''
            router.push('/distribusi')
          }}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0"
        >
          Reset
        </button>
      )}
    </div>
  )
}
