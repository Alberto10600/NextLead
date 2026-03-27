import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'plan'
  className?: string
}

const variantClasses = {
  default: 'bg-slate-800 text-gray-500 border border-slate-700',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  error:   'bg-red-500/15 text-red-400 border border-red-500/25',
  info:    'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  plan:    'bg-blue-600 text-white border border-blue-500/40',
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${variantClasses[variant]} ${className}
      `}
    >
      {children}
    </span>
  )
}
