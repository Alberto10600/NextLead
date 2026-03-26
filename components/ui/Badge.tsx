import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'plan'
  className?: string
}

const variantClasses = {
  default: 'bg-slate-700 text-slate-300',
  success: 'bg-green-900/50 text-green-400',
  warning: 'bg-amber-900/50 text-amber-400',
  error:   'bg-red-900/50 text-red-400',
  info:    'bg-blue-900/50 text-blue-400',
  plan:    'bg-blue-600 text-white',
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
        ${variantClasses[variant]} ${className}
      `}
    >
      {children}
    </span>
  )
}
