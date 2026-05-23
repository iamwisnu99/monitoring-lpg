'use client'

import dynamic from 'next/dynamic'
import type { RawWarungForMap } from './DashboardMap'

const DashboardMap = dynamic(() => import('./DashboardMap'), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-2xl shadow-sm overflow-hidden"
      style={{ background: '#ffffff', height: '504px' }}
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: '#dcfce7' }}
        />
        <div>
          <div className="h-4 w-36 rounded bg-slate-100 animate-pulse" />
          <div className="h-3 w-24 rounded bg-slate-50 animate-pulse mt-1.5" />
        </div>
      </div>
      <div className="flex items-center justify-center" style={{ height: '420px', background: '#f8fafc' }}>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-400">Memuat peta...</p>
        </div>
      </div>
    </div>
  ),
})

interface Props {
  warungs: RawWarungForMap[]
  pangkalanList: { id: string; nama: string }[]
}

export default function DashboardMapWrapper({ warungs, pangkalanList }: Props) {
  return <DashboardMap warungs={warungs} pangkalanList={pangkalanList} />
}
