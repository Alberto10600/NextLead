import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'plan'
  className?: string
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-500 border border-gray-200',
  success: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-600 border border-amber-200',
  error:   'bg-red-50 text-red-500 border border-red-200',
  info:    'bg-blue-50 text-blue-600 border border-blue-200',
  plan:    'bg-orange-500 text-white border border-orange-400',
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
