import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface OptionItem {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: OptionItem[]
  error?: string
}

export function Select({ label, options, error, className, ...props }: SelectProps) {
  return (
    <label className="block space-y-1.5 text-sm">
      {label ? <span className="font-medium text-slate-700">{label}</span> : null}
      <select
        className={cn(
          'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-slate-900 outline-none ring-offset-2 transition focus:border-teal-300 focus:ring-4 focus:ring-teal-100',
          error ? 'border-red-400 focus:border-red-300 focus:ring-red-100' : '',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
