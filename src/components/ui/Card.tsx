import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'premium-card p-5',
        hover ? 'transition duration-300 hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]' : '',
        className,
      )}
    >
      {children}
    </div>
  )
}
