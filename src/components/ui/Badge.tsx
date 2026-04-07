import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface BadgeProps {
  children: ReactNode
  tone?: 'default' | 'accent' | 'success' | 'warning'
  className?: string
}

const toneClass: Record<NonNullable<BadgeProps['tone']>, string> = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  accent: 'bg-teal-50 text-teal-800 border-teal-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
}

export function Badge({ children, tone = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
