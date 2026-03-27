'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            bg-[#0D1321] border rounded-lg px-3 py-2.5 text-sm text-slate-200
            placeholder:text-slate-600 outline-none transition-all duration-150
            focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40
            ${error ? 'border-red-500/50' : 'border-white/10'}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
