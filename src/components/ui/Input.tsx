import type { InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="block space-y-1.5 text-sm">
      {label ? <span className="font-medium text-slate-700">{label}</span> : null}
      <input
        className={cn(
          'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-slate-900 outline-none ring-offset-2 transition placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-100',
          error ? 'border-red-400 focus:border-red-300 focus:ring-red-100' : '',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
