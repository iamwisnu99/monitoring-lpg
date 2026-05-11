import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">Memuat data...</p>
    </div>
  )
}
