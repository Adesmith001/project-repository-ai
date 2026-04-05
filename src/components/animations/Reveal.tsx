import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(visible ? 'animate-fade-up opacity-100' : 'opacity-0', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
