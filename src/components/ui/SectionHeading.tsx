import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  action?: ReactNode
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('space-y-3', align === 'center' ? 'text-center' : '', className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
      ) : null}
      <h2 className="text-balance text-3xl font-extrabold text-slate-950 sm:text-4xl">{title}</h2>
      {description ? (
        <p className={cn('text-base leading-7 text-slate-600', align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl')}>
          {description}
        </p>
      ) : null}
      {action}
    </div>
  )
}
