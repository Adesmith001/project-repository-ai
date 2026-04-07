import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <label className="block space-y-1.5 text-sm">
      {label ? <span className="font-medium text-slate-700">{label}</span> : null}
      <textarea
        className={cn(
          'min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 outline-none ring-offset-2 transition placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-100',
          error ? 'border-red-400 focus:border-red-300 focus:ring-red-100' : '',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}

export const TextArea = Textarea
