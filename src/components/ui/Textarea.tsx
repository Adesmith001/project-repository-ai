import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <label className="block space-y-1 text-sm">
      {label ? <span className="font-medium text-slate-700">{label}</span> : null}
      <textarea
        className={cn(
          'min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-offset-2 transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200',
          error ? 'border-red-500 focus:ring-red-100' : '',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
