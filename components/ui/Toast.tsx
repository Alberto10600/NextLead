'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

const typeClasses = {
  success: 'bg-green-900/90 border-green-700 text-green-200',
  error:   'bg-red-900/90 border-red-700 text-red-200',
  info:    'bg-blue-900/90 border-blue-700 text-blue-200',
}

export default function Toast({ message, type = 'info', onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${typeClasses[type]}`}>
        <span>{message}</span>
        <button onClick={onClose} className="opacity-70 hover:opacity-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
