import { Suspense } from 'react'
import KonfirmasiEmailContent from './KonfirmasiEmailContent'

export default function KonfirmasiEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    }>
      <KonfirmasiEmailContent />
    </Suspense>
  )
}

