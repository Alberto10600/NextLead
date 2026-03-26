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
          <label className="text-xs text-slate-400 font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            bg-[#0f172a] border rounded-md px-3 py-2 text-sm text-slate-200
            placeholder:text-slate-600 outline-none transition-all duration-200
            focus:ring-1 focus:ring-blue-500
            ${error ? 'border-red-500' : 'border-[#334155] focus:border-blue-500'}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
