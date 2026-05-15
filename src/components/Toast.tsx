'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'

interface ToastProps {
  message: string
  subMessage?: string
  duration?: number
  onClose: () => void
}

export default function Toast({ message, subMessage, duration = 5000, onClose }: ToastProps) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      
      if (remaining <= 0) {
        clearInterval(timer)
        onClose()
      }
    }, 10)

    return () => clearInterval(timer)
  }, [duration, onClose])

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-full sm:max-w-sm z-[200] animate-slide-in-right">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-3 sm:p-4 flex items-center sm:items-start gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-xs sm:text-sm leading-tight truncate sm:whitespace-normal">{message}</p>
            {subMessage && (
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate sm:whitespace-normal">{subMessage}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-slate-50 w-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
